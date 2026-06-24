// =============================================================
// Next.js 16 の proxy（旧 middleware）
//   毎リクエストで Supabase セッションを更新し、Cookie を書き戻す。
// =============================================================
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

// 静的アセットを除く全ページに適用
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
