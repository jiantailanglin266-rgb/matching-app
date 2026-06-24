// 静的書き出し用スタブ: いいね/Undo（デモ動作）
export type LikeResult =
  | { ok: true; matched: boolean }
  | { ok: false; error: string };

export async function sendLike(toUserId: string): Promise<LikeResult> {
  // あおい(u1)へのいいねは相互いいね成立として扱う
  return { ok: true, matched: toUserId === "u1" };
}

export async function cancelLike(_toUserId: string): Promise<{ ok: boolean }> {
  return { ok: true };
}
