// =============================================================
// アバター用のヘルパー
//   写真が無いユーザーでも、IDから決まる色のグラデーション＋イニシャルで
//   「全員同じ顔」にならないようにする。
//   同じIDなら毎回同じ色になる（決定的）ので、見た目が安定する。
// =============================================================

// グラデーションの候補（2色1組）
const GRADIENTS: [string, string][] = [
  ["#fda4af", "#fb7185"], // rose
  ["#f9a8d4", "#ec4899"], // pink
  ["#c4b5fd", "#a78bfa"], // violet
  ["#93c5fd", "#60a5fa"], // blue
  ["#6ee7b7", "#34d399"], // emerald
  ["#fcd34d", "#fbbf24"], // amber
  ["#fdba74", "#fb923c"], // orange
  ["#a5b4fc", "#818cf8"], // indigo
];

// 文字列を数値に変換（簡易ハッシュ）
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

// IDから CSS のグラデーション文字列を返す
export function gradientFor(id: string): string {
  const [a, b] = GRADIENTS[hash(id) % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

// カルーセルのスライドごとに色を変える（写真が無いときの背景用）
export function gradientForIndex(id: string, index: number): string {
  const [a, b] = GRADIENTS[(hash(id) + index) % GRADIENTS.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
}

// 名前の先頭1文字（イニシャル）。空なら「？」
export function initialOf(name: string): string {
  return name.trim().charAt(0) || "？";
}
