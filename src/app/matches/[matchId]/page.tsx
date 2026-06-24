// =============================================================
// チャット画面（マッチした2人のみ）
//   サーバー側で:
//     1. match を取得（RLSで当事者以外は取れない → notFound）
//     2. 既存メッセージを取得
//     3. 相手のプロフィールを取得
//   その後、リアルタイム購読は ChatBox（クライアント）が担当。
// =============================================================
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { ChatBox } from "@/components/ChatBox";
import { Avatar } from "@/components/Avatar";
import {
  DEMO_MODE,
  DEMO_ME,
  DEMO_MESSAGES,
  demoOtherForMatch,
} from "@/lib/demo";
import type { Match, Message, Profile } from "@/lib/types";

// 通常運用では requireUser() が cookies() を使うため自動的に動的レンダリングになる。

// 静的書き出しデモ（GitHub Pages）用: デモのマッチだけ事前生成する。
export async function generateStaticParams() {
  if (process.env.STATIC_EXPORT !== "1") return [];
  return [{ matchId: "m1" }];
}

// チャットの共通レイアウト（相手ヘッダー＋本体）
function ChatLayout({
  other,
  children,
}: {
  other: Profile | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col">
      {/* 相手ヘッダー */}
      <div className="mb-3 flex items-center gap-3">
        {other && (
          <Link
            href={`/users/${other.id}`}
            className="h-10 w-10 shrink-0 overflow-hidden rounded-full"
          >
            <Avatar profile={other} className="h-full w-full" />
          </Link>
        )}
        <h1 className="text-lg font-bold">{other?.display_name ?? "チャット"}</h1>
      </div>
      {children}
    </div>
  );
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;

  // ▼ デモモード
  if (DEMO_MODE) {
    const other = demoOtherForMatch(matchId);
    if (!other) notFound();
    return (
      <ChatLayout other={other}>
        <ChatBox
          matchId={matchId}
          myId={DEMO_ME.id}
          initialMessages={DEMO_MESSAGES[matchId] ?? []}
          demo
        />
      </ChatLayout>
    );
  }
  // ▲

  const { supabase, user } = await requireUser();

  // 1) マッチ確認（当事者でなければ RLS で取得できない）
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .maybeSingle<Match>();

  if (!match) notFound(); // マッチしていない2人はチャット不可

  // 2) 既存メッセージ（古い順）
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true })
    .returns<Message[]>();

  // 3) 相手のプロフィール
  const otherId = match.user_a === user.id ? match.user_b : match.user_a;
  const { data: other } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", otherId)
    .maybeSingle<Profile>();

  return (
    <ChatLayout other={other ?? null}>
      <ChatBox matchId={matchId} myId={user.id} initialMessages={messages ?? []} />
    </ChatLayout>
  );
}
