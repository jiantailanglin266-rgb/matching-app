"use server";
// =============================================================
// いいね関連の Server Action
//   いいねを送ると、相手も自分にいいね済みなら DB トリガーが
//   自動で matches を作る（→ 相互いいねマッチング成立）。
//   ここでは「成立したかどうか」を呼び出し側に返すために、
//   いいね後に matches を確認している。
// =============================================================
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { DEMO_MODE } from "@/lib/demo";

export type LikeResult =
  | { ok: true; matched: boolean } // matched=true ならその場でマッチ成立
  | { ok: false; error: string };

export async function sendLike(toUserId: string): Promise<LikeResult> {
  // ▼ デモモード: あおい(u1)へのいいねは即マッチ成立として返す
  if (DEMO_MODE) {
    return { ok: true, matched: toUserId === "u1" };
  }
  // ▲

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };
  if (user.id === toUserId) return { ok: false, error: "自分にはいいねできません" };

  // 1) いいねを保存（RLSで from_user=自分 を強制。重複は unique 制約で弾かれる）
  const { error: likeError } = await supabase
    .from("likes")
    .insert({ from_user: user.id, to_user: toUserId });

  // 重複いいね（23505）は「すでに送信済み」として成功扱いにする
  if (likeError && likeError.code !== "23505") {
    return { ok: false, error: likeError.message };
  }

  // 2) マッチが成立したか確認（トリガーが matches に入れているはず）
  //    ペアは user_a < user_b に正規化されているので両方向を調べる
  const [a, b] = user.id < toUserId ? [user.id, toUserId] : [toUserId, user.id];
  const { data: match } = await supabase
    .from("matches")
    .select("id")
    .eq("user_a", a)
    .eq("user_b", b)
    .maybeSingle();

  revalidatePath("/discover");
  revalidatePath("/matches");

  return { ok: true, matched: !!match };
}

// =============================================================
// いいねの取り消し（Undo）
//   直前に送ったいいねを削除する。もし相互いいねでマッチが
//   できていた場合は、非相互になるのでマッチも削除する。
// =============================================================
export async function cancelLike(toUserId: string): Promise<{ ok: boolean }> {
  // ▼ デモモード: 何もしない（成功扱い）
  if (DEMO_MODE) return { ok: true };
  // ▲

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // いいねを削除（RLSで from_user=自分 のみ削除可）
  await supabase.from("likes").delete().eq("from_user", user.id).eq("to_user", toUserId);

  // もしマッチができていたら、非相互になるので削除
  const [a, b] = user.id < toUserId ? [user.id, toUserId] : [toUserId, user.id];
  await supabase.from("matches").delete().eq("user_a", a).eq("user_b", b);

  revalidatePath("/discover");
  revalidatePath("/matches");
  return { ok: true };
}
