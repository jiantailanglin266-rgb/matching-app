"use server";
// =============================================================
// チャット送信の Server Action
//   マッチした当事者だけが送れる。実際の権限チェックは
//   RLS の messages_insert ポリシーが最終防衛線になっている。
// =============================================================
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type SendMessageResult = { ok: true } | { ok: false; error: string };

export async function sendMessage(
  matchId: string,
  content: string
): Promise<SendMessageResult> {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "メッセージが空です" };
  if (trimmed.length > 2000) return { ok: false, error: "長すぎます（2000文字まで）" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  // sender_id=自分 / match当事者のみ、は RLS が保証する。
  const { error } = await supabase.from("messages").insert({
    match_id: matchId,
    sender_id: user.id,
    content: trimmed,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/matches/${matchId}`);
  return { ok: true };
}
