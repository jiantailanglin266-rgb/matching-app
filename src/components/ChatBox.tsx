"use client";
// =============================================================
// チャット本体（クライアントコンポーネント）
//   ・初期メッセージはサーバーから受け取る
//   ・Supabase Realtime で新着メッセージをリアルタイム受信
//   ・送信は Server Action sendMessage（RLSで当事者のみ許可）
// =============================================================
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "@/lib/actions/chat";
import type { Message } from "@/lib/types";

// ISO日時を「HH:MM」表記に
function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export function ChatBox({
  matchId,
  myId,
  initialMessages,
  demo = false,
}: {
  matchId: string;
  myId: string;
  initialMessages: Message[];
  demo?: boolean; // デモモード: Realtime/サーバー送信を使わずローカルで完結
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // 新着が来たら一番下までスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime 購読: この match の messages に INSERT があれば反映
  useEffect(() => {
    if (demo) return; // デモではRealtimeを使わない
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) =>
            // 自分が送って楽観表示済みのものは重複させない
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, demo]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText("");

    // デモモード: サーバーに送らず画面にだけ追加して動きを見せる
    if (demo) {
      setMessages((prev) => [
        ...prev,
        {
          id: `local-${prev.length}`,
          match_id: matchId,
          sender_id: myId,
          content,
          created_at: new Date().toISOString(),
        },
      ]);
      return;
    }

    startTransition(async () => {
      const res = await sendMessage(matchId, content);
      if (!res.ok) {
        alert(res.error);
        setText(content); // 失敗したら入力を戻す
      }
      // 成功時の表示は Realtime の INSERT 通知が反映してくれる
    });
  }

  return (
    <>
      {/* メッセージ一覧 */}
      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl border bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-400">
            マッチしました！最初のメッセージを送ってみましょう。
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === myId;
          return (
            <div
              key={m.id}
              className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[75%] px-3.5 py-2 text-sm leading-relaxed ${
                  mine
                    ? "rounded-2xl rounded-br-md bg-brand text-white"
                    : "rounded-2xl rounded-bl-md bg-gray-100 text-gray-900 dark:bg-neutral-800 dark:text-gray-100"
                }`}
              >
                {m.content}
              </div>
              <span className="mt-0.5 px-1 text-[10px] text-gray-400">
                {formatTime(m.created_at)}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="メッセージを入力…"
          className="flex-1 rounded-full border px-4 py-2 dark:border-neutral-700 dark:bg-neutral-800"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-brand px-5 font-bold text-white disabled:opacity-50"
        >
          送信
        </button>
      </form>
    </>
  );
}
