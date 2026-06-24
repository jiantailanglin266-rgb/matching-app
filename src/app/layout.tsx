import type { Metadata } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "マッチング",
  description: "マッチング機能モジュール",
};

// 描画前にテーマを適用してチラつき(FOUC)を防ぐスクリプト
const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 dark:bg-neutral-950">
        {/* テーマ初期適用（body冒頭で同期実行） */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />

        {/* 上部ブランドバー */}
        <header className="sticky top-0 z-10 border-b bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90">
          <div className="relative mx-auto flex max-w-2xl items-center justify-center px-4 py-3">
            <span className="bg-gradient-to-r from-brand to-rose-400 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
              💗 Matching
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* 本文（下部ナビの高さ分の余白を確保） */}
        <main className="mx-auto max-w-2xl px-4 py-5 pb-24">{children}</main>

        {/* 下部タブナビ */}
        <BottomNav />
      </body>
    </html>
  );
}
