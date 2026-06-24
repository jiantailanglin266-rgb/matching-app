#!/usr/bin/env bash
# =============================================================
# 静的書き出しデモ（GitHub Pages用）をビルドする。
#   一時的に next.config.mjs を静的版へ差し替え、proxy(middleware)を退避し、
#   STATIC_EXPORT/DEMO_MODE を立てて `next build` → out/ を生成する。
#   ビルド後は元の構成へ必ず戻す（trap）。
# =============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

restore() {
  [ -f next.config.mjs.bak ] && mv -f next.config.mjs.bak next.config.mjs || true
  [ -f src/proxy.ts.bak ] && mv -f src/proxy.ts.bak src/proxy.ts || true
  [ -d src/app/_auth.bak ] && mv -f src/app/_auth.bak src/app/auth || true
}
trap restore EXIT

# 1) 設定を静的版に差し替え
mv -f next.config.mjs next.config.mjs.bak
cp -f next.config.static.mjs next.config.mjs

# 2) proxy(middleware)は static export 非対応なので退避
[ -f src/proxy.ts ] && mv -f src/proxy.ts src/proxy.ts.bak || true

# 2b) 認証コールバックのRoute Handlerも static export 非対応なので退避（デモ不要）
[ -d src/app/auth ] && mv -f src/app/auth src/app/_auth.bak || true

# 3) ビルド（デモモード＋ダミーSupabase値）
rm -rf out
STATIC_EXPORT=1 \
NEXT_PUBLIC_DEMO_MODE=1 \
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy \
  npx next build

# 4) GitHub Pages が _next/ を配信できるよう Jekyll を無効化
touch out/.nojekyll

echo "✅ 静的書き出し完了: out/"
