-- =============================================================
-- マッチング機能モジュール スキーマ定義
-- Supabase SQL Editor にそのまま貼って実行できます。
--
-- 設計方針:
--  * 性格診断・キャラクター機能は「別モジュール」。
--    このモジュールは診断結果を profiles テーブルの一部カラム
--    （personality_type / character_type / interests / purpose）として
--    “受け取るだけ”にして疎結合を保つ。
--    → 診断モジュール側が profiles を UPDATE する想定。
--  * 相互いいねの判定は DB トリガーで自動化（アプリ側のバグに依存しない）。
-- =============================================================

-- UUID 生成などの拡張（Supabase では通常デフォルトで有効）
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------
-- 1) profiles : ユーザープロフィール
--    id は auth.users.id と 1:1。Supabase Auth のユーザーに紐づく。
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text not null,
  age             int  check (age between 18 and 120),       -- 18歳未満は登録不可
  gender          text check (gender in ('male','female','other')),
  location        text,                                       -- 居住地（都道府県など）
  bio             text,
  avatar_url      text,
  photos          text[] default '{}',                        -- 複数写真URL（カルーセル用）

  -- ▼ ここから下は「診断モジュール」が書き込む想定（このモジュールは読むだけ）
  personality_type text,                                      -- 例: 'INFP'
  character_type    text,                                     -- 例: 'cat-type'
  interests        text[] default '{}',                       -- 趣味タグの配列
  purpose          text,                                      -- 利用目的: 'friend' / 'serious' など
  -- ▲ ここまで診断モジュール連携

  is_active       boolean not null default true,              -- 退会・凍結フラグ
  last_active_at  timestamptz not null default now(),         -- アクティブ率の計算に使用
  created_at      timestamptz not null default now()
);

-- 検索・絞り込みでよく使う列にインデックス
create index if not exists idx_profiles_gender   on public.profiles(gender);
create index if not exists idx_profiles_location on public.profiles(location);
create index if not exists idx_profiles_purpose  on public.profiles(purpose);
create index if not exists idx_profiles_interests on public.profiles using gin(interests);

-- -------------------------------------------------------------
-- 2) likes : いいね（一方向）
--    from_user が to_user に「いいね」した記録。
-- -------------------------------------------------------------
create table if not exists public.likes (
  id         uuid primary key default gen_random_uuid(),
  from_user  uuid not null references public.profiles(id) on delete cascade,
  to_user    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (from_user, to_user),          -- 同じ相手への二重いいね防止
  check (from_user <> to_user)          -- 自分自身へのいいね禁止
);
create index if not exists idx_likes_to_user on public.likes(to_user);

-- -------------------------------------------------------------
-- 3) matches : マッチング成立（相互いいね）
--    2人を user_a < user_b の順で正規化して保存し、ペアの重複を防ぐ。
-- -------------------------------------------------------------
create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references public.profiles(id) on delete cascade,
  user_b     uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (user_a < user_b),              -- 常に小さいUUIDをaにする
  unique (user_a, user_b)
);
create index if not exists idx_matches_user_a on public.matches(user_a);
create index if not exists idx_matches_user_b on public.matches(user_b);

-- -------------------------------------------------------------
-- 4) messages : チャットメッセージ（マッチした2人のみ）
-- -------------------------------------------------------------
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references public.matches(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  content    text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_match on public.messages(match_id, created_at);

-- -------------------------------------------------------------
-- 5) blocks : ブロック
-- -------------------------------------------------------------
create table if not exists public.blocks (
  id         uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists idx_blocks_blocker on public.blocks(blocker_id);
create index if not exists idx_blocks_blocked on public.blocks(blocked_id);

-- -------------------------------------------------------------
-- 6) reports : 通報
-- -------------------------------------------------------------
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_id uuid not null references public.profiles(id) on delete cascade,
  reason      text not null,
  status      text not null default 'pending' check (status in ('pending','reviewing','resolved')),
  created_at  timestamptz not null default now(),
  check (reporter_id <> reported_id)
);
create index if not exists idx_reports_reported on public.reports(reported_id);
create index if not exists idx_reports_status   on public.reports(status);

-- -------------------------------------------------------------
-- 7) 管理者判定用のヘルパー
--    auth.users の user_metadata に { "role": "admin" } を入れた人を管理者とする。
-- -------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- =============================================================
-- 相互いいね → マッチ自動成立 トリガー
--   likes に INSERT されたとき、相手→自分のいいねが既にあれば
--   matches に自動で1行作る（重複は unique 制約で弾く）。
-- =============================================================
create or replace function public.try_create_match()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  reverse_exists boolean;
  a uuid;
  b uuid;
begin
  -- 相手から自分へのいいねが既にあるか？
  select exists(
    select 1 from public.likes
    where from_user = new.to_user and to_user = new.from_user
  ) into reverse_exists;

  if reverse_exists then
    -- ペアを正規化（小さいUUIDを a に）
    if new.from_user < new.to_user then
      a := new.from_user; b := new.to_user;
    else
      a := new.to_user;   b := new.from_user;
    end if;

    insert into public.matches(user_a, user_b)
    values (a, b)
    on conflict (user_a, user_b) do nothing;  -- 既にマッチ済みなら何もしない
  end if;

  return new;
end;
$$;

drop trigger if exists trg_try_create_match on public.likes;
create trigger trg_try_create_match
after insert on public.likes
for each row execute function public.try_create_match();

-- =============================================================
-- Realtime 配信を messages テーブルで有効化
--   （チャットのリアルタイム受信に使用）
-- =============================================================
alter publication supabase_realtime add table public.messages;
