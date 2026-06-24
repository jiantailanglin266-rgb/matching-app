"use client";
// =============================================================
// スワイプUI（Tinder風）
//   ・カードをドラッグして 右=いいね / 左=スキップ
//   ・✕ / ♥ ボタンでも操作可能
//   ・↩ Undoで直前のスワイプを取り消し（いいねはサーバーからも削除）
//   ・カードは複数写真カルーセル（PhotoCarousel）
//   ・いいねで相互いいねになったら「マッチ成立」演出
//   外部ライブラリ不要。Pointer Events でマウス/タッチ両対応。
// =============================================================
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { sendLike, cancelLike } from "@/lib/actions/like";
import { PhotoCarousel } from "./PhotoCarousel";
import { purposeLabel } from "@/lib/labels";
import type { ScoredProfile } from "./DiscoverClient";
import type { Profile } from "@/lib/types";

const THRESHOLD = 100; // この距離以上ドラッグしたらスワイプ確定
const CAPTURE_AT = 8; // この距離を超えて初めて「ドラッグ」と判定（タップを誤検知しない）

type Action = { id: string; dir: "like" | "nope" };

export function SwipeDeck({ items }: { items: ScoredProfile[] }) {
  const [index, setIndex] = useState(0); // 現在の先頭カード
  const [drag, setDrag] = useState({ x: 0, y: 0 }); // ドラッグ量
  const [leaving, setLeaving] = useState<null | "like" | "nope">(null); // 飛んでいく方向
  const [matched, setMatched] = useState<Profile | null>(null); // マッチ成立した相手
  const [history, setHistory] = useState<Action[]>([]); // Undo用の履歴

  const dragging = useRef(false);
  const captured = useRef(false); // 一定距離動いたらドラッグ確定
  const start = useRef({ x: 0, y: 0 });
  const router = useRouter();

  const current = items[index];
  const next = items[index + 1];

  // ---- ポインタ操作 ----------------------------------------
  function onPointerDown(e: React.PointerEvent) {
    if (leaving) return;
    dragging.current = true;
    captured.current = false;
    start.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    // 一定距離動いて初めてポインタを掴む（=タップは写真送りに通す）
    if (!captured.current && Math.hypot(dx, dy) > CAPTURE_AT) {
      captured.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (captured.current) setDrag({ x: dx, y: dy });
  }
  function onPointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (!captured.current) return; // ただのタップ
    if (drag.x > THRESHOLD) triggerSwipe("like");
    else if (drag.x < -THRESHOLD) triggerSwipe("nope");
    else setDrag({ x: 0, y: 0 }); // 戻す
  }

  // ---- スワイプ確定 ----------------------------------------
  function triggerSwipe(dir: "like" | "nope") {
    if (!current) return;
    const target = current.profile;
    setLeaving(dir);
    setHistory((h) => [...h, { id: target.id, dir }]);

    if (dir === "like") {
      sendLike(target.id).then((res) => {
        if (res.ok && res.matched) setMatched(target);
      });
    }

    setTimeout(() => {
      setIndex((i) => i + 1);
      setDrag({ x: 0, y: 0 });
      setLeaving(null);
    }, 300);
  }

  // ---- Undo（直前のスワイプを取り消す） ---------------------
  function undo() {
    if (history.length === 0 || leaving) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setIndex((i) => Math.max(i - 1, 0));
    setMatched(null); // マッチ演出が出ていたら閉じる
    if (last.dir === "like") {
      cancelLike(last.id); // サーバー側のいいね（とマッチ）も削除
    }
  }

  // 先頭カードの transform
  const topStyle: React.CSSProperties = leaving
    ? {
        transform: `translateX(${leaving === "like" ? "150%" : "-150%"}) rotate(${
          leaving === "like" ? 25 : -25
        }deg)`,
        transition: "transform 0.3s ease-out",
        opacity: 0,
      }
    : {
        transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 20}deg)`,
        transition: captured.current ? "none" : "transform 0.25s ease-out",
      };

  const likeOpacity = Math.min(Math.max(drag.x / THRESHOLD, 0), 1);
  const nopeOpacity = Math.min(Math.max(-drag.x / THRESHOLD, 0), 1);

  // ---- 全部見終わった ----------------------------------------
  if (!current) {
    return (
      <div className="py-20 text-center">
        <p className="text-4xl">🎉</p>
        <p className="mt-3 font-bold">全員チェックしました！</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          また新しい人が登録されたら表示されます。
        </p>
        {history.length > 0 && (
          <button
            onClick={undo}
            className="mt-5 rounded-full border px-5 py-2 text-sm font-medium text-gray-700 dark:border-neutral-700 dark:text-gray-200"
          >
            ↩ 1つ戻す
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="select-none">
      {/* カード置き場 */}
      <div className="relative mx-auto aspect-[3/4] w-full max-w-sm">
        {/* 次のカード（背面・少し小さく） */}
        {next && (
          <div className="absolute inset-0 scale-[0.96] opacity-80">
            <SwipeCard item={next} interactive={false} />
          </div>
        )}

        {/* 先頭カード（操作対象） */}
        <div
          className="absolute inset-0 cursor-grab touch-none active:cursor-grabbing"
          style={topStyle}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <SwipeCard item={current} interactive>
            {/* LIKE / NOPE スタンプ */}
            <span
              style={{ opacity: likeOpacity }}
              className="pointer-events-none absolute left-4 top-8 z-20 rotate-[-15deg] rounded-lg border-4 border-emerald-400 px-3 py-1 text-2xl font-extrabold text-emerald-400"
            >
              LIKE
            </span>
            <span
              style={{ opacity: nopeOpacity }}
              className="pointer-events-none absolute right-4 top-8 z-20 rotate-[15deg] rounded-lg border-4 border-rose-500 px-3 py-1 text-2xl font-extrabold text-rose-500"
            >
              NOPE
            </span>
          </SwipeCard>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="mt-5 flex items-center justify-center gap-4">
        {/* Undo */}
        <button
          onClick={undo}
          disabled={history.length === 0 || !!leaving}
          aria-label="1つ戻す"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-amber-500 shadow ring-1 ring-black/5 transition hover:scale-105 disabled:opacity-40 dark:bg-neutral-800 dark:ring-white/10"
        >
          ↩
        </button>
        {/* スキップ */}
        <button
          onClick={() => triggerSwipe("nope")}
          disabled={!!leaving}
          aria-label="スキップ"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl text-rose-500 shadow-md ring-1 ring-black/5 transition hover:scale-105 disabled:opacity-50 dark:bg-neutral-800 dark:ring-white/10"
        >
          ✕
        </button>
        {/* 詳細 */}
        <Link
          href={`/users/${current.profile.id}`}
          aria-label="詳細を見る"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg text-gray-400 shadow ring-1 ring-black/5 transition hover:scale-105 dark:bg-neutral-800 dark:ring-white/10"
        >
          ℹ️
        </Link>
        {/* いいね */}
        <button
          onClick={() => triggerSwipe("like")}
          disabled={!!leaving}
          aria-label="いいね"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl text-white shadow-md transition hover:scale-105 disabled:opacity-50"
        >
          ♥
        </button>
      </div>

      {/* マッチ成立オーバーレイ */}
      {matched && (
        <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-br from-brand/95 to-rose-400/95 p-6 text-center text-white">
          <p className="text-5xl">💞</p>
          <h2 className="mt-4 text-3xl font-extrabold">マッチ成立！</h2>
          <p className="mt-2 text-white/90">{matched.display_name}さんとマッチしました</p>
          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => router.push("/matches")}
              className="rounded-full bg-white px-8 py-3 font-bold text-brand-dark"
            >
              メッセージを送る
            </button>
            <button
              onClick={() => setMatched(null)}
              className="text-sm font-medium text-white/90 underline"
            >
              スワイプを続ける
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- カードの中身（見た目だけ） -------------------------------
function SwipeCard({
  item,
  interactive,
  children,
}: {
  item: ScoredProfile;
  interactive: boolean; // 先頭カードのみ写真送りを有効化
  children?: React.ReactNode;
}) {
  const { profile, score } = item;
  const percent = Math.round(score * 100);
  return (
    <div className="relative h-full w-full overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/10">
      {/* 写真カルーセル（背面カードはタップ無効化したいので pointer-events を制御） */}
      <div className={`h-full ${interactive ? "" : "pointer-events-none"}`}>
        <PhotoCarousel profile={profile} />
      </div>

      {/* 相性スコア */}
      <div className="pointer-events-none absolute right-3 top-6 z-20 rounded-full bg-white/85 px-3 py-1 text-sm font-bold text-brand-dark shadow backdrop-blur">
        相性 {percent}%
      </div>

      {/* 下部グラデ＋情報 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/75 to-transparent p-5 pt-16 text-white">
        <p className="text-2xl font-extrabold drop-shadow">
          {profile.display_name}
          {profile.age != null && (
            <span className="ml-2 text-xl font-semibold">{profile.age}</span>
          )}
        </p>
        <p className="mt-0.5 text-sm text-white/90">📍 {profile.location ?? "居住地未設定"}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {profile.interests.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white/25 px-2.5 py-0.5 text-xs backdrop-blur"
            >
              #{tag}
            </span>
          ))}
        </div>
        {purposeLabel(profile.purpose) && (
          <p className="mt-2 text-xs text-white/85">🎯 {purposeLabel(profile.purpose)}</p>
        )}
      </div>

      {children}
    </div>
  );
}
