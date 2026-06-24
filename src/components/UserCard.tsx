// =============================================================
// ユーザーカード（おすすめ一覧で使う）
//   デーティングアプリ風: 大きめ写真 + 下部グラデ + 名前オーバーレイ。
//   右上に相性スコアバッジ（推薦ロジックの点数を%表示）。
// =============================================================
import Link from "next/link";
import { Avatar } from "./Avatar";
import { purposeLabel } from "@/lib/labels";
import type { Profile } from "@/lib/types";

export function UserCard({ profile, score }: { profile: Profile; score: number }) {
  const percent = Math.round(score * 100); // 0〜1 を % に
  return (
    <Link
      href={`/users/${profile.id}`}
      className="group relative block overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-lg dark:bg-neutral-900 dark:ring-white/10"
    >
      {/* 写真エリア（正方形） */}
      <div className="relative aspect-square w-full overflow-hidden">
        <Avatar
          profile={profile}
          className="h-full w-full transition duration-300 group-hover:scale-105"
        />

        {/* 相性スコアバッジ */}
        <div className="absolute right-2 top-2 rounded-full bg-white/85 px-2.5 py-1 text-xs font-bold text-brand-dark shadow backdrop-blur">
          相性 {percent}%
        </div>

        {/* 下部グラデの上に名前を重ねる */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 pt-8">
          <p className="text-base font-bold text-white drop-shadow">
            {profile.display_name}
            {profile.age != null && (
              <span className="ml-1 text-sm font-medium">{profile.age}</span>
            )}
          </p>
          <p className="text-xs text-white/85">{profile.location ?? "居住地未設定"}</p>
        </div>
      </div>

      {/* 趣味・目的 */}
      <div className="space-y-2 p-3">
        <div className="flex flex-wrap gap-1">
          {profile.interests.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-pink-50 px-2 py-0.5 text-xs text-brand-dark dark:bg-brand/15 dark:text-pink-300"
            >
              #{tag}
            </span>
          ))}
        </div>
        {purposeLabel(profile.purpose) && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🎯 {purposeLabel(profile.purpose)}
          </p>
        )}
      </div>
    </Link>
  );
}
