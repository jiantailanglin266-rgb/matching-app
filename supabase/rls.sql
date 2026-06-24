-- =============================================================
-- Row Level Security (RLS) ポリシー
--   schema.sql を実行した後に、このファイルを実行してください。
--
-- 原則:
--  * 自分のデータしか作成・更新・削除できない。
--  * 他人のプロフィールは「見える」が、ブロック関係・凍結中は見えない。
--  * チャットは matches に存在する当人2人だけが読み書きできる。
-- =============================================================

-- 全テーブルで RLS を有効化
alter table public.profiles enable row level security;
alter table public.likes    enable row level security;
alter table public.matches  enable row level security;
alter table public.messages enable row level security;
alter table public.blocks   enable row level security;
alter table public.reports  enable row level security;

-- -------------------------------------------------------------
-- profiles
-- -------------------------------------------------------------
-- 閲覧: ログインユーザーは、アクティブで、かつ自分と相互にブロックしていない相手を見られる。
--       自分自身は常に見られる。
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or (
    is_active = true
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = profiles.id)
         or (b.blocker_id = profiles.id and b.blocked_id = auth.uid())
    )
  )
);

-- 追加: 自分のプロフィールだけ作成できる（id = auth.uid()）
drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles
for insert to authenticated
with check (id = auth.uid());

-- 更新: 自分のプロフィールだけ
drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- -------------------------------------------------------------
-- likes
-- -------------------------------------------------------------
-- 作成: from_user は必ず自分。相手をブロックしている/されている場合は不可。
drop policy if exists "likes_insert" on public.likes;
create policy "likes_insert" on public.likes
for insert to authenticated
with check (
  from_user = auth.uid()
  and not exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = likes.to_user)
       or (b.blocker_id = likes.to_user and b.blocked_id = auth.uid())
  )
);

-- 閲覧: 自分が送った/もらったいいねのみ
drop policy if exists "likes_select" on public.likes;
create policy "likes_select" on public.likes
for select to authenticated
using (from_user = auth.uid() or to_user = auth.uid());

-- 取り消し: 自分が送ったいいねのみ削除可
drop policy if exists "likes_delete" on public.likes;
create policy "likes_delete" on public.likes
for delete to authenticated
using (from_user = auth.uid());

-- -------------------------------------------------------------
-- matches
--   作成はトリガー(security definer)が行うので、ユーザーからの INSERT は許可しない。
-- -------------------------------------------------------------
drop policy if exists "matches_select" on public.matches;
create policy "matches_select" on public.matches
for select to authenticated
using (user_a = auth.uid() or user_b = auth.uid());

-- -------------------------------------------------------------
-- messages
--   その match の当事者2人だけが読める・書ける。
-- -------------------------------------------------------------
drop policy if exists "messages_select" on public.messages;
create policy "messages_select" on public.messages
for select to authenticated
using (
  exists (
    select 1 from public.matches m
    where m.id = messages.match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())
  )
);

drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages
for insert to authenticated
with check (
  sender_id = auth.uid()                       -- 送信者は必ず自分
  and exists (
    select 1 from public.matches m
    where m.id = messages.match_id
      and (m.user_a = auth.uid() or m.user_b = auth.uid())   -- マッチ当事者のみ
  )
);

-- -------------------------------------------------------------
-- blocks
-- -------------------------------------------------------------
drop policy if exists "blocks_insert" on public.blocks;
create policy "blocks_insert" on public.blocks
for insert to authenticated
with check (blocker_id = auth.uid());

drop policy if exists "blocks_select" on public.blocks;
create policy "blocks_select" on public.blocks
for select to authenticated
using (blocker_id = auth.uid());

drop policy if exists "blocks_delete" on public.blocks;
create policy "blocks_delete" on public.blocks
for delete to authenticated
using (blocker_id = auth.uid());

-- -------------------------------------------------------------
-- reports
--   作成: 自分が通報者。閲覧: 通報者本人 or 管理者。
--   ステータス更新: 管理者のみ。
-- -------------------------------------------------------------
drop policy if exists "reports_insert" on public.reports;
create policy "reports_insert" on public.reports
for insert to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "reports_select" on public.reports;
create policy "reports_select" on public.reports
for select to authenticated
using (reporter_id = auth.uid() or public.is_admin());

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin" on public.reports
for update to authenticated
using (public.is_admin())
with check (public.is_admin());
