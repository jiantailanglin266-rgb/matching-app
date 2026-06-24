// =============================================================
// おすすめ推薦ロジック
//   候補ユーザーの「絞り込み」は DB (recommended_candidates RPC) が担当。
//   ここでは絞り込んだ候補に「点数」を付けて並び替える。
//
//   配点（合計100%）:
//     性格タイプ相性 : 40%
//     趣味一致       : 20%
//     利用目的一致   : 15%
//     年齢・居住地    : 15%
//     アクティブ率   : 10%
//
//   疎結合のポイント:
//     性格タイプの相性スコア(0〜1)は、本来「診断モジュール」が持つ知識。
//     ここでは差し替え可能な関数 compatibilityScore() として切り出してあり、
//     将来は診断モジュールが提供する compatibility_score をそのまま使える。
// =============================================================
import type { Profile } from "./types";

// 各項目の重み（合計 = 1.0）
export const WEIGHTS = {
  personality: 0.4,
  interests: 0.2,
  purpose: 0.15,
  ageLocation: 0.15,
  activity: 0.1,
} as const;

// ---- 1) 性格タイプ相性（0〜1） -------------------------------
// MVPでは簡易ルール: 同じタイプ=0.6、相性の良い組合せ=1.0、不明=0.5。
// ★将来は診断モジュールの compatibility_score(meType, themType) に差し替え。
const GOOD_PAIRS: Record<string, string[]> = {
  INFP: ["ENFJ", "ENTJ", "INFJ"],
  ENFJ: ["INFP", "ISFP"],
  ISFP: ["ENFJ", "ESFJ"],
  // …必要に応じて追加
};

export function compatibilityScore(meType: string | null, themType: string | null): number {
  if (!meType || !themType) return 0.5; // どちらか不明なら中間値
  if (GOOD_PAIRS[meType]?.includes(themType)) return 1.0;
  if (meType === themType) return 0.6;
  return 0.4;
}

// ---- 2) 趣味一致（0〜1）: 共通タグ数 ÷ 自分のタグ数 ----------
function interestScore(me: Profile, them: Profile): number {
  if (me.interests.length === 0) return 0.5;
  const themSet = new Set(them.interests);
  const common = me.interests.filter((i) => themSet.has(i)).length;
  return Math.min(common / me.interests.length, 1);
}

// ---- 3) 利用目的一致（0〜1）: 一致=1, 不一致=0, 不明=0.5 -----
function purposeScore(me: Profile, them: Profile): number {
  if (!me.purpose || !them.purpose) return 0.5;
  return me.purpose === them.purpose ? 1 : 0;
}

// ---- 4) 年齢・居住地（0〜1） --------------------------------
//   年齢差が小さいほど高得点（10歳差で0点）。居住地一致でボーナス。
function ageLocationScore(me: Profile, them: Profile): number {
  let ageScore = 0.5;
  if (me.age != null && them.age != null) {
    const diff = Math.abs(me.age - them.age);
    ageScore = Math.max(0, 1 - diff / 10);
  }
  const locScore = me.location && me.location === them.location ? 1 : 0;
  // 年齢70% + 居住地30% の内訳で合成
  return ageScore * 0.7 + locScore * 0.3;
}

// ---- 5) アクティブ率（0〜1） -------------------------------
//   最終アクティブが新しいほど高得点（14日でほぼ0）。
function activityScore(them: Profile, now: number): number {
  const last = new Date(them.last_active_at).getTime();
  const days = (now - last) / (1000 * 60 * 60 * 24);
  return Math.max(0, 1 - days / 14);
}

// ---- 総合スコア（0〜1） -----------------------------------
export function scoreCandidate(me: Profile, them: Profile, now: number = Date.now()): number {
  return (
    WEIGHTS.personality * compatibilityScore(me.personality_type, them.personality_type) +
    WEIGHTS.interests * interestScore(me, them) +
    WEIGHTS.purpose * purposeScore(me, them) +
    WEIGHTS.ageLocation * ageLocationScore(me, them) +
    WEIGHTS.activity * activityScore(them, now)
  );
}

// 候補配列をスコアの高い順に並べ替えて返す
export function rankCandidates(me: Profile, candidates: Profile[]): Profile[] {
  const now = Date.now();
  return [...candidates]
    .map((c) => ({ c, s: scoreCandidate(me, c, now) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c);
}
