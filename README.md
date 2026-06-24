# マッチング機能モジュール

性格診断・キャラクター機能とは**疎結合**な、マッチング専用モジュールです。
「ユーザー検索・おすすめ・いいね・マッチング・チャット」を担当します。

- 技術構成: **Next.js (App Router) / TypeScript / Tailwind CSS / Supabase (Auth・PostgreSQL・Realtime)**
- 診断モジュールからは `profiles` テーブルの一部カラムを通じてデータを受け取るだけ
  （`personality_type` / `character_type` / `interests` / `purpose`）。
  → 診断側が `profiles` を UPDATE する。マッチング側は読むだけ。

---

## 0. クイックスタート

```bash
cd matching-app
npm install
cp .env.local.example .env.local   # Supabaseの値を記入

# Supabase の SQL Editor で順番に実行
#   1) supabase/schema.sql
#   2) supabase/rls.sql
#   3) supabase/functions.sql

npm run dev   # http://localhost:3000
```

> 管理者にするには、対象ユーザーの `auth.users.user_metadata` に `{"role":"admin"}` を設定します。

---

## 1. 全体設計

```
[ブラウザ] ──いいね/送信(Server Action)──► [Next.js Server] ──► [Supabase/PostgreSQL]
     ▲                                                              │
     └────────── Realtime(WebSocket)で新着メッセージ受信 ◄──────────┘
```

- **認証**: Supabase Auth（このサンプルはメールのマジックリンク）。`proxy.ts`（Next16の旧middleware）で毎リクエスト、セッションを更新。
- **データ取得**: Server Component が `requireUser()` でログイン確認 → Supabaseから取得。
- **書き込み**: Server Action（`like.ts` / `chat.ts` / `moderation.ts` / `admin.ts`）。
- **マッチ成立判定**: アプリではなく **DBトリガー** `try_create_match()` が担当（相互いいねを検知して `matches` に自動INSERT）。アプリのバグに依存しない。
- **チャット**: 初期表示はサーバー取得、新着は **Supabase Realtime** で購読。
- **安全性の最終防衛線**: すべて **RLS**。アプリのチェックを突破されてもDBが拒否する。

### おすすめの絞り込みとスコアリングの責務分担
- **絞り込み（誰を出すか）= DB**: `recommended_candidates` RPC が
  「自分・ブロック・マッチ済み・通報多数・凍結中」を除外。
- **並び替え（どの順で出すか）= アプリ**: `src/lib/recommend.ts` がスコア計算。
  配点 = 性格相性40% / 趣味20% / 目的15% / 年齢・居住地15% / アクティブ率10%。

---

## 2. DBテーブル設計

| テーブル | 役割 | 主なカラム |
|---|---|---|
| `profiles` | プロフィール（診断結果も保持） | id(=auth.users), display_name, age, gender, location, bio, **personality_type / character_type / interests / purpose**, is_active, last_active_at |
| `likes` | いいね（一方向） | from_user, to_user（unique, 自己いいね禁止） |
| `matches` | 相互いいね成立 | user_a, user_b（user_a<user_b で正規化, unique） |
| `messages` | チャット | match_id, sender_id, content |
| `blocks` | ブロック | blocker_id, blocked_id |
| `reports` | 通報 | reporter_id, reported_id, reason, status |

詳細は [`supabase/schema.sql`](supabase/schema.sql)。

---

## 3. Supabase用SQL
- スキーマ + トリガー + Realtime有効化: [`supabase/schema.sql`](supabase/schema.sql)
- おすすめ候補RPC: [`supabase/functions.sql`](supabase/functions.sql)
- ダミーデータ: [`supabase/seed.sql`](supabase/seed.sql)

## 4. RLSポリシー
[`supabase/rls.sql`](supabase/rls.sql)。要点:
- `profiles`: 自分は常に閲覧可。他人はアクティブ かつ 相互ブロックなしのみ。更新は本人のみ。
- `likes`: 送信は `from_user=自分` 限定、ブロック相手には不可。閲覧は自分の送受信のみ。
- `matches`: 当事者のみ閲覧。INSERTはユーザーに許可せず**トリガー(security definer)**が行う。
- `messages`: その matchの当事者のみ read/write。`sender_id=自分` 強制。
- `reports`: 作成は本人。閲覧は本人 or 管理者。ステータス更新は管理者のみ。

## 5. API設計（Server Actions / RPC / Route）

| 種別 | 名前 | 引数 | 返り値 / 効果 |
|---|---|---|---|
| Action | `sendLike(toUserId)` | 相手ID | `{ok, matched}` いいね保存＋成立判定 |
| Action | `sendMessage(matchId, content)` | マッチID, 本文 | メッセージ送信 |
| Action | `blockUser(targetId)` | 相手ID | ブロック登録 |
| Action | `reportUser(targetId, reason)` | 相手ID, 理由 | 通報登録 |
| Action | `updateReportStatus(formData)` | reportId, status | 管理者: 状態更新 |
| RPC | `recommended_candidates(report_threshold=5)` | 閾値 | おすすめ候補のprofiles |
| Route | `GET /auth/callback` | ?code | セッション確立→/discover |

## 6. フォルダ構成

```
matching-app/
├─ supabase/
│  ├─ schema.sql        # テーブル・トリガー・Realtime
│  ├─ rls.sql           # RLSポリシー
│  ├─ functions.sql     # おすすめ候補RPC
│  └─ seed.sql          # ダミーデータ
└─ src/
   ├─ proxy.ts                 # セッション更新（Next16のproxy=旧middleware）
   ├─ app/
   │  ├─ layout.tsx            # 共通ヘッダー
   │  ├─ page.tsx              # /discover へリダイレクト
   │  ├─ login/page.tsx        # ログイン
   │  ├─ auth/callback/route.ts
   │  ├─ discover/page.tsx     # ★おすすめ一覧
   │  ├─ users/[id]/page.tsx   # ★ユーザー詳細
   │  ├─ matches/page.tsx      # ★マッチ一覧
   │  ├─ matches/[matchId]/page.tsx  # ★チャット
   │  └─ admin/reports/page.tsx      # 管理者:通報確認
   ├─ components/
   │  ├─ UserCard.tsx
   │  ├─ LikeButton.tsx        # ★いいね
   │  ├─ ChatBox.tsx           # ★Realtimeチャット
   │  └─ BlockReportMenu.tsx
   └─ lib/
      ├─ types.ts
      ├─ recommend.ts          # ★推薦スコア(40/20/15/15/10)
      ├─ supabase/{client,server,middleware}.ts
      └─ actions/{like,chat,moderation,admin}.ts
```
★ = MVPの中心機能。

## 7〜14. 画面・処理コード
- ユーザー一覧 → [`discover/page.tsx`](src/app/discover/page.tsx)
- ユーザー詳細 → [`users/[id]/page.tsx`](src/app/users/[id]/page.tsx)
- いいね処理 → [`actions/like.ts`](src/lib/actions/like.ts) ＋ [`LikeButton.tsx`](src/components/LikeButton.tsx)
- マッチ成立処理 → DBトリガー `try_create_match()`（[`schema.sql`](supabase/schema.sql)）
- マッチ一覧 → [`matches/page.tsx`](src/app/matches/page.tsx)
- チャット → [`matches/[matchId]/page.tsx`](src/app/matches/[matchId]/page.tsx) ＋ [`ChatBox.tsx`](src/components/ChatBox.tsx)
- ブロック・通報 → [`actions/moderation.ts`](src/lib/actions/moderation.ts) ＋ [`BlockReportMenu.tsx`](src/components/BlockReportMenu.tsx)
- 管理画面 → [`admin/reports/page.tsx`](src/app/admin/reports/page.tsx)

---

## 15. テスト観点

**機能**
- 自分自身がおすすめ/一覧に出ない
- ブロックした相手・された相手が双方向で消える
- マッチ済みの相手はおすすめに出ない
- 通報が閾値（5件）以上のユーザーが消える
- AがBにいいね→BがAにいいねした瞬間に matches が1件だけ作られる（二重作成されない）
- マッチしていない2人は `/matches/[id]` にアクセスしても 404
- いいねの重複送信がエラーにならない（既送信扱い）

**RLS（重要）**
- 他人の `auth.uid()` を偽装したトークンで他人のメッセージが読めない
- 当事者でないユーザーが `messages` にINSERTできない
- 一般ユーザーが `reports` を全件SELECTできない / `matches` に直接INSERTできない
- 退会(`is_active=false`)ユーザーが一覧から消える

**推薦ロジック（純粋関数なのでユニットテスト容易）**
- `scoreCandidate()` が 0〜1 に収まる
- 各重みの合計が 1.0（`WEIGHTS`）
- 趣味全一致・目的一致・同居住地・直近アクティブで高スコアになる

**リアルタイム**
- 相手の送信が自分の画面に追加表示される
- 自分の送信が二重表示されない（id重複ガード）

## 16. セキュリティ注意点

- **RLSを必ず有効化**（`rls.sql`）。RLSがアクセス制御の本丸。アプリ側チェックは利便性のためで、信頼の根拠にしない。
- **service_role キーはサーバー専用**。`NEXT_PUBLIC_` を付けない／クライアントへ渡さない。
- **`auth.getUser()` を使う**（`getSession()` はクッキー由来で改ざんの恐れ。サーバーでの本人確認は `getUser()`）。
- いいね/送信の権限は「リクエストの値」ではなく `auth.uid()` で判定（なりすまし防止）。
- 入力バリデーション（メッセージ長・年齢18歳以上）はDBの `check` 制約にも入れて二重化。
- 通報・ブロックは相互方向で効かせ、ハラスメント耐性を持たせる。
- チャットは当事者2人限定（`messages` のRLSで `match_id` の所属を検証）。
- 画像URL等の外部入力を表示する際はXSSに注意（本サンプルはテキストとして描画）。

---

## 診断モジュールとの連携（疎結合の約束）

このモジュールが診断側に求めるのは **`profiles` の次のカラムを埋めること**だけ:

```
personality_type, character_type, interests(text[]), purpose
```

性格相性の計算は `src/lib/recommend.ts` の `compatibilityScore()` に隔離してあります。
将来、診断モジュールが `compatibility_score(meType, themType)` を提供するなら、
この1関数を差し替えるだけで連携できます（他のコードは変更不要）。
