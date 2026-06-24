// =============================================================
// さがす画面（ユーザー一覧 ＋ おすすめ順 ＋ 絞り込み）
//   流れ:
//     1. ログインユーザー & 自分のプロフィール取得
//     2. RPC recommended_candidates で候補取得（DB側で除外処理）
//     3. recommend.ts で各候補にスコアを付与
//     4. スコア付きリストを DiscoverClient(クライアント) に渡す
//        → 絞り込みUIはクライアント側で動かす
// =============================================================
import { requireUser } from "@/lib/supabase/server";
import { scoreCandidate } from "@/lib/recommend";
import { DiscoverClient, type ScoredProfile } from "@/components/DiscoverClient";
import { DEMO_MODE, DEMO_ME, DEMO_PROFILES } from "@/lib/demo";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

// 候補にスコアを付けて高い順に並べる
function toScored(me: Profile, candidates: Profile[]): ScoredProfile[] {
  const now = Date.now();
  return candidates
    .map((p) => ({ profile: p, score: scoreCandidate(me, p, now) }))
    .sort((a, b) => b.score - a.score);
}

export default async function DiscoverPage() {
  // ▼ デモモード
  if (DEMO_MODE) {
    return <DiscoverClient items={toScored(DEMO_ME, DEMO_PROFILES)} />;
  }
  // ▲

  const { supabase, user } = await requireUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!me) {
    return (
      <p className="text-center text-gray-600">
        まずプロフィールを作成してください（診断モジュール側で登録されます）。
      </p>
    );
  }

  const { data: candidates, error } = await supabase.rpc("recommended_candidates");
  if (error) {
    return <p className="text-red-600">読み込みエラー: {error.message}</p>;
  }

  return <DiscoverClient items={toScored(me, (candidates ?? []) as Profile[])} />;
}
