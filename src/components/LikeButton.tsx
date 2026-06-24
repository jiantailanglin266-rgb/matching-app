"use client";
// =============================================================
// いいねボタン（クライアントコンポーネント）
//   Server Action sendLike を呼び、マッチ成立ならお祝い表示。
// =============================================================
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendLike } from "@/lib/actions/like";

export function LikeButton({ toUserId }: { toUserId: string }) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [matched, setMatched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const res = await sendLike(toUserId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDone(true);
      if (res.matched) {
        setMatched(true);
        // 1.5秒お祝いを見せてからマッチ一覧へ
        setTimeout(() => router.push("/matches"), 1500);
      }
    });
  }

  if (matched) {
    return (
      <div className="rounded-xl bg-brand px-4 py-3 text-center font-bold text-white">
        🎉 マッチ成立！チャットへ移動します…
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={isPending || done}
        className="w-full rounded-xl bg-brand py-3 font-bold text-white disabled:opacity-50"
      >
        {done ? "♥ いいね済み" : isPending ? "送信中…" : "♥ いいね"}
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
