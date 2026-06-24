// =============================================================
// このモジュール内で使う型定義
// =============================================================

// 利用目的の選択肢（検索の絞り込みでも使う）
export type Purpose = "friend" | "serious" | "casual";

// プロフィール（DBの profiles テーブルに対応）
export type Profile = {
  id: string;
  display_name: string;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  location: string | null;
  bio: string | null;
  avatar_url: string | null;
  photos: string[]; // 複数写真（カルーセル用）。空なら avatar_url / グラデにフォールバック

  // ▼ 診断モジュールから受け取る項目（疎結合：このモジュールは読むだけ）
  personality_type: string | null;
  character_type: string | null;
  interests: string[];
  purpose: Purpose | null;
  // ▲

  is_active: boolean;
  last_active_at: string; // ISO文字列
  created_at: string;
};

// チャットメッセージ（messages テーブルに対応）
export type Message = {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

// マッチ（matches テーブルに対応）
export type Match = {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
};

// 検索の絞り込み条件
export type SearchFilters = {
  ageMin?: number;
  ageMax?: number;
  gender?: Profile["gender"];
  location?: string;
  interest?: string; // 趣味タグ1つで絞る簡易版
  purpose?: Purpose;
  personalityType?: string;
};
