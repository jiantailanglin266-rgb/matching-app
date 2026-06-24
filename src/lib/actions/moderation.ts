"use server";
// =============================================================
// ブロック・通報の Server Action（MVPでは画面は最小限）
//   ・ブロック: 以降おすすめ・検索・チャットから相互に除外される
//   ・通報: 管理者が後で確認する。多数たまると自動で非表示に。
// =============================================================
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function blockUser(targetId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "ログインが必要です" };

  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: user.id, blocked_id: targetId });

  if (error && error.code !== "23505") return { ok: false as const, error: error.message };

  revalidatePath("/discover");
  return { ok: true as const };
}

export async function reportUser(targetId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "ログインが必要です" };

  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: user.id, reported_id: targetId, reason });

  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}
