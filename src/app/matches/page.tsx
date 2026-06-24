// =============================================================
// マッチ一覧画面
//   自分が当事者の matches を取得し、相手のプロフィールを表示。
//   各行クリックでチャットへ。
// =============================================================
import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import {
  DEMO_MODE,
  DEMO_ME,
  DEMO_MATCHES,
  DEMO_MESSAGES,
  DEMO_PROFILES,
} from "@/lib/demo";
import type { Match, Profile } from "@/lib/types";

// 通常運用では requireUser() が cookies() を使うため自動的に動的レンダリングになる。

export default async function MatchesPage() {
  // ▼ デモモード（最後のメッセージをプレビューに使う）
  if (DEMO_MODE) {
    const previews: Record<string, string> = {};
    for (const m of DEMO_MATCHES) {
      const msgs = DEMO_MESSAGES[m.id];
      if (msgs?.length) previews[m.id] = msgs[msgs.length - 1].content;
    }
    return (
      <MatchesView
        myId={DEMO_ME.id}
        list={DEMO_MATCHES}
        profiles={DEMO_PROFILES}
        previews={previews}
      />
    );
  }
  // ▲

  const { supabase, user } = await requireUser();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Match[]>();

  const list = matches ?? [];
  const otherIds = list.map((m) => (m.user_a === user.id ? m.user_b : m.user_a));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", otherIds)
    .returns<Profile[]>();

  return (
    <MatchesView myId={user.id} list={list} profiles={profiles ?? []} previews={{}} />
  );
}

// マッチ一覧の見た目（通常・デモ共用）
function MatchesView({
  myId,
  list,
  profiles,
  previews,
}: {
  myId: string;
  list: Match[];
  profiles: Profile[];
  previews: Record<string, string>;
}) {
  if (list.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-4xl">💞</p>
        <p className="mt-3 font-bold">まだマッチがありません</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          「さがす」からいいねを送ってみましょう。
        </p>
        <Link
          href="/discover"
          className="mt-5 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-bold text-white"
        >
          さがしに行く
        </Link>
      </div>
    );
  }

  const byId = new Map(profiles.map((p) => [p.id, p]));

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">マッチ</h1>
      <ul className="space-y-2">
        {list.map((m) => {
          const otherId = m.user_a === myId ? m.user_b : m.user_a;
          const other = byId.get(otherId);
          return (
            <li key={m.id}>
              <Link
                href={`/matches/${m.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5 transition hover:shadow-md dark:bg-neutral-900 dark:ring-white/10"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full">
                  {other ? (
                    <Avatar profile={other} className="h-full w-full" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-200 text-2xl">
                      🙂
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{other?.display_name ?? "退会したユーザー"}</p>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {previews[m.id] ?? "タップしてチャットを始めましょう"}
                  </p>
                </div>
                <span className="text-gray-300 dark:text-gray-600">›</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
