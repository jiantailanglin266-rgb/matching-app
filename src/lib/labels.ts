// =============================================================
// コード値 → 画面表示用の日本語ラベル
// =============================================================
import type { Profile, Purpose } from "./types";

export const PURPOSE_LABEL: Record<Purpose, string> = {
  serious: "真剣な恋愛",
  friend: "友達から",
  casual: "気軽に",
};

export const GENDER_LABEL: Record<NonNullable<Profile["gender"]>, string> = {
  male: "男性",
  female: "女性",
  other: "その他",
};

export function purposeLabel(p: Profile["purpose"]): string | null {
  return p ? PURPOSE_LABEL[p] : null;
}

export function genderLabel(g: Profile["gender"]): string | null {
  return g ? GENDER_LABEL[g] : null;
}
