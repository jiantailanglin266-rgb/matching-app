// 静的書き出し用スタブ: メッセージ送信（デモはローカルechoなので呼ばれない）
export type SendMessageResult = { ok: true } | { ok: false; error: string };

export async function sendMessage(): Promise<SendMessageResult> {
  return { ok: true };
}
