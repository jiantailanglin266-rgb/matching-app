-- =============================================================
-- おすすめ候補を取り出す RPC
--   schema.sql / rls.sql の後に実行してください。
--
--   ここでは「候補の絞り込み」だけを行い、点数付け（推薦スコア）は
--   アプリ側 (src/lib/recommend.ts) で行う。
--   → ロジックを TypeScript 側に集約して読みやすく/テストしやすくする狙い。
--
--   security invoker（デフォルト）なので RLS がそのまま効く。
--   つまりブロック済み・凍結中は profiles の RLS で既に除外される。
--   この関数では追加で次を除外する:
--     * 自分自身
--     * すでにマッチ済みの相手
--     * 通報が閾値（既定5件）以上たまっている相手
-- =============================================================
create or replace function public.recommended_candidates(report_threshold int default 5)
returns setof public.profiles
language sql
stable
as $$
  select p.*
  from public.profiles p
  where p.id <> auth.uid()                                   -- 自分は除外
    -- すでにマッチ済みの相手を除外
    and not exists (
      select 1 from public.matches m
      where (m.user_a = auth.uid() and m.user_b = p.id)
         or (m.user_b = auth.uid() and m.user_a = p.id)
    )
    -- 通報多数のユーザーを除外
    and (
      select count(*) from public.reports r where r.reported_id = p.id
    ) < report_threshold;
$$;
