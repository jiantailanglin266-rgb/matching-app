// =============================================================
// ブラウザ（クライアントコンポーネント）用の Supabase クライアント
//   "use client" のコンポーネントから使う。
//   Realtime チャットの購読などに利用。
// =============================================================
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
