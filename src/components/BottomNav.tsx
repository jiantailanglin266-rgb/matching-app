"use client";
// =============================================================
// 下部タブナビ（スマホアプリ風）
//   現在地のタブをハイライトする。
// =============================================================
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/discover", label: "さがす", icon: "🔍" },
  { href: "/matches", label: "マッチ", icon: "💬" },
];

export function BottomNav() {
  const pathname = usePathname();

  // ログイン画面ではナビを出さない
  if (pathname?.startsWith("/login")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
      <div className="mx-auto flex max-w-2xl">
        {TABS.map((t) => {
          const active = pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition ${
                active ? "text-brand" : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              }`}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
