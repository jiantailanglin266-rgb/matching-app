// =============================================================
// アバター表示コンポーネント
//   写真(photos[0] か avatar_url)があれば写真、
//   無ければ色付きグラデ＋イニシャルを描く。
//   サーバー/クライアントどちらからでも使える純粋な表示部品。
// =============================================================
import { gradientFor, initialOf } from "@/lib/avatar";
import type { Profile } from "@/lib/types";

type Props = {
  profile: Pick<Profile, "id" | "display_name" | "avatar_url" | "photos">;
  /** 一辺のピクセル数（円形）。指定しなければ親要素いっぱいに広がる */
  size?: number;
  className?: string;
};

export function Avatar({ profile, size, className = "" }: Props) {
  const style = size
    ? { width: size, height: size }
    : { width: "100%", height: "100%" };

  // 代表写真: photos優先、なければ avatar_url
  const photo = profile.photos?.[0] ?? profile.avatar_url;

  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photo}
        alt={profile.display_name}
        style={style}
        className={`object-cover ${className}`}
      />
    );
  }

  // 写真が無い場合: グラデ背景＋イニシャル
  return (
    <div
      style={{ ...style, background: gradientFor(profile.id) }}
      className={`flex items-center justify-center font-bold text-white ${className}`}
    >
      <span style={{ fontSize: size ? size * 0.42 : "2rem" }}>
        {initialOf(profile.display_name)}
      </span>
    </div>
  );
}
