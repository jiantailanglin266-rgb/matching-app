// =============================================================
// 静的書き出し（GitHub Pages）専用の Next 設定
//   scripts/build-static.sh から、一時的に next.config.mjs と
//   差し替えて使う。本番(SSR)ビルドには影響しない。
//
//   ・output: "export"        … 静的HTMLとして書き出す
//   ・basePath                … GitHub Pages のプロジェクトサイト用 (/matching-app)
//   ・turbopack.resolveAlias  … サーバー専用モジュール/Server Actionを
//                               クライアント安全なデモ用スタブへ差し替え
// =============================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/matching-app",
  trailingSlash: true,
  images: { unoptimized: true },
  turbopack: {
    resolveAlias: {
      "@/lib/supabase/server": "./scripts/static-stubs/supabase-server.ts",
      "@/lib/actions/like": "./scripts/static-stubs/actions-like.ts",
      "@/lib/actions/chat": "./scripts/static-stubs/actions-chat.ts",
      "@/lib/actions/moderation": "./scripts/static-stubs/actions-moderation.ts",
      "@/lib/actions/admin": "./scripts/static-stubs/actions-admin.ts",
    },
  },
};

export default nextConfig;
