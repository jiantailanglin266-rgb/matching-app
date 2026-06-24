// 静的書き出し用スタブ: ブロック/通報（デモ動作）
export async function blockUser(_targetId: string) {
  return { ok: true as const };
}

export async function reportUser(_targetId: string, _reason: string) {
  return { ok: true as const };
}
