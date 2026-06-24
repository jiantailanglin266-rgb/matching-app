"use client";
// =============================================================
// 写真カルーセル（Instagramストーリー風のセグメントバー付き）
//   ・写真が複数あれば、左右タップ or ドット送りで切替
//   ・各スライドの背景にグラデを敷くので、写真の読み込み失敗時も自然
//   ・写真ゼロのときはグラデ＋イニシャルを1枚表示
// =============================================================
import { useState } from "react";
import { gradientForIndex, initialOf } from "@/lib/avatar";
import type { Profile } from "@/lib/types";

export function PhotoCarousel({ profile }: { profile: Profile }) {
  const photos = profile.photos ?? [];
  const count = Math.max(photos.length, 1);
  const [idx, setIdx] = useState(0);

  function go(delta: number) {
    setIdx((i) => Math.min(Math.max(i + delta, 0), count - 1));
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* スライド本体（背景グラデ＋写真） */}
      <div
        className="absolute inset-0"
        style={{ background: gradientForIndex(profile.id, idx) }}
      >
        {photos[idx] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[idx]}
            alt={profile.display_name}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-white">
            {initialOf(profile.display_name)}
          </div>
        )}
      </div>

      {/* 上部セグメントバー（写真が2枚以上のとき） */}
      {count > 1 && (
        <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i === idx ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}

      {/* 左右タップゾーン（写真送り） */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="前の写真"
            className="absolute left-0 top-0 z-10 h-full w-1/3"
          />
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="次の写真"
            className="absolute right-0 top-0 z-10 h-full w-1/3"
          />
        </>
      )}
    </div>
  );
}
