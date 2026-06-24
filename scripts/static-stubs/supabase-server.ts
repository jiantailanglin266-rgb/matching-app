// =============================================================
// 静的書き出し(GitHub Pages)用スタブ
//   実Supabaseに繋がない。デモ用ページは requireUser を使う前に
//   DEMO_MODE 分岐で return するので、ここは安全なダミーで足りる。
//   ※本番ビルドでは使われない（next.config.static.mjs のエイリアスでのみ差し替え）
// =============================================================
export function createClient() {
  return {} as never;
}

export async function requireUser() {
  return {
    supabase: {} as never,
    user: { id: "me", user_metadata: {} } as never,
  };
}
