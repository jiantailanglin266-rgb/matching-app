// =============================================================
// デモモード（プレビュー用）
//   NEXT_PUBLIC_DEMO_MODE=1 のときだけ有効。
//   Supabaseに接続せず、固定のモックデータで全画面を描画する。
//   ★本番のSupabase実装には一切手を入れていない。デモは“別の入り口”。
//   フラグを 0 にすれば、通常どおり Supabase 経由で動く。
// =============================================================
import type { Match, Message, Profile } from "./types";

export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

// ログイン中の自分（デモ）
export const DEMO_ME: Profile = {
  id: "me",
  display_name: "あなた",
  age: 26,
  gender: "male",
  location: "東京都",
  bio: "デモユーザーです。",
  avatar_url: null,
  photos: [],
  personality_type: "INFP",
  character_type: "cat-type",
  interests: ["カフェ", "映画", "旅行"],
  purpose: "serious",
  is_active: true,
  last_active_at: "2026-06-25T00:00:00Z",
  created_at: "2026-01-01T00:00:00Z",
};

// おすすめ候補（デモ）
export const DEMO_PROFILES: Profile[] = [
  {
    id: "u1",
    display_name: "あおい",
    age: 24,
    gender: "female",
    location: "東京都",
    bio: "カフェ巡りと映画が好きです☕️ 休日は街歩きしてます。",
    avatar_url: null,
    photos: [
      "https://picsum.photos/seed/aoi1/600/800",
      "https://picsum.photos/seed/aoi2/600/800",
      "https://picsum.photos/seed/aoi3/600/800",
    ],
    personality_type: "ENFJ", // INFPと相性◎
    character_type: "dog-type",
    interests: ["カフェ", "映画", "旅行"], // 趣味フル一致
    purpose: "serious", // 目的一致
    is_active: true,
    last_active_at: "2026-06-25T00:00:00Z", // 直近アクティブ
    created_at: "2026-02-01T00:00:00Z",
  },
  {
    id: "u2",
    display_name: "はると",
    age: 29,
    gender: "female",
    location: "神奈川県",
    bio: "週末は登山。自然が好きです🏔",
    avatar_url: null,
    photos: [
      "https://picsum.photos/seed/haru1/600/800",
      "https://picsum.photos/seed/haru2/600/800",
    ],
    personality_type: "ISFP",
    character_type: "cat-type",
    interests: ["登山", "旅行", "料理"],
    purpose: "friend",
    is_active: true,
    last_active_at: "2026-06-23T00:00:00Z",
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "u3",
    display_name: "みお",
    age: 22,
    gender: "female",
    location: "東京都",
    bio: "インドア派。ゲームと映画。",
    avatar_url: null,
    photos: ["https://picsum.photos/seed/mio1/600/800"],
    personality_type: "INTP",
    character_type: "cat-type",
    interests: ["映画", "ゲーム"],
    purpose: "casual",
    is_active: true,
    last_active_at: "2026-06-10T00:00:00Z",
    created_at: "2026-04-01T00:00:00Z",
  },
];

// 既に成立しているマッチ（デモ）: 自分 ↔ あおい
export const DEMO_MATCHES: Match[] = [
  { id: "m1", user_a: "me", user_b: "u1", created_at: "2026-06-24T10:00:00Z" },
];

// マッチID → 相手プロフィール
export function demoOtherForMatch(matchId: string): Profile | undefined {
  const m = DEMO_MATCHES.find((x) => x.id === matchId);
  if (!m) return undefined;
  const otherId = m.user_a === DEMO_ME.id ? m.user_b : m.user_a;
  return DEMO_PROFILES.find((p) => p.id === otherId);
}

// チャットの初期メッセージ（デモ）
export const DEMO_MESSAGES: Record<string, Message[]> = {
  m1: [
    {
      id: "msg1",
      match_id: "m1",
      sender_id: "u1",
      content: "マッチしました！はじめまして😊",
      created_at: "2026-06-24T10:05:00Z",
    },
    {
      id: "msg2",
      match_id: "m1",
      sender_id: "me",
      content: "はじめまして！プロフィール拝見しました、カフェ好きなんですね☕️",
      created_at: "2026-06-24T10:07:00Z",
    },
  ],
};
