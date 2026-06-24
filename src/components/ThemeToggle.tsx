"use client";
// =============================================================
// ダークモード切替ボタン
//   localStorage に 'theme'（light/dark）を保存。
//   未設定ならOSの設定に従う（初期適用は layout のインラインscript）。
// =============================================================
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // 初期表示時、現在の <html> の状態を読む
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label="テーマ切替"
      className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-full text-lg transition hover:bg-black/5 dark:hover:bg-white/10"
    >
      {dark ? "🌙" : "☀️"}
    </button>
  );
}
