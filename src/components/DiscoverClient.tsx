"use client";
// =============================================================
// おすすめ一覧＋絞り込み（クライアントコンポーネント）
//   サーバーから「スコア付き候補」を受け取り、画面側で
//   年齢/性別/居住地/趣味/利用目的/性格タイプ で絞り込む。
//   ※本番で件数が増えたら、絞り込みはサーバー(SQL)側に移すのが理想。
//     ここはMVPのUXデモとしてクライアントで実装。
// =============================================================
import { useMemo, useState } from "react";
import { UserCard } from "./UserCard";
import { SwipeDeck } from "./SwipeDeck";
import { PURPOSE_LABEL, GENDER_LABEL } from "@/lib/labels";
import type { Profile, Purpose } from "@/lib/types";

type ViewMode = "swipe" | "grid";

export type ScoredProfile = { profile: Profile; score: number };

type Filters = {
  ageMin: string;
  ageMax: string;
  gender: string;
  location: string;
  interest: string;
  purpose: string;
  personalityType: string;
};

const EMPTY: Filters = {
  ageMin: "",
  ageMax: "",
  gender: "",
  location: "",
  interest: "",
  purpose: "",
  personalityType: "",
};

export function DiscoverClient({ items }: { items: ScoredProfile[] }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("swipe"); // 既定はスワイプ
  const [f, setF] = useState<Filters>(EMPTY);

  // セレクトの選択肢を候補データから動的に作る
  const locations = useMemo(
    () => uniq(items.map((i) => i.profile.location).filter(Boolean) as string[]),
    [items]
  );
  const interests = useMemo(
    () => uniq(items.flatMap((i) => i.profile.interests)),
    [items]
  );
  const personalities = useMemo(
    () => uniq(items.map((i) => i.profile.personality_type).filter(Boolean) as string[]),
    [items]
  );

  // 絞り込み実行
  const filtered = useMemo(() => {
    return items.filter(({ profile: p }) => {
      if (f.ageMin && (p.age == null || p.age < Number(f.ageMin))) return false;
      if (f.ageMax && (p.age == null || p.age > Number(f.ageMax))) return false;
      if (f.gender && p.gender !== f.gender) return false;
      if (f.location && p.location !== f.location) return false;
      if (f.interest && !p.interests.includes(f.interest)) return false;
      if (f.purpose && p.purpose !== f.purpose) return false;
      if (f.personalityType && p.personality_type !== f.personalityType) return false;
      return true;
    });
  }, [items, f]);

  // 適用中の条件数（バッジ表示用）
  const activeCount = Object.values(f).filter((v) => v !== "").length;

  function set<K extends keyof Filters>(key: K, value: string) {
    setF((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      {/* ヘッダー行 */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">あなたへのおすすめ</h1>
        <div className="flex items-center gap-2">
          {/* 表示切替: スワイプ / 一覧 */}
          <div className="flex overflow-hidden rounded-full border text-sm dark:border-neutral-700">
            <button
              onClick={() => setView("swipe")}
              className={`px-3 py-1.5 font-medium ${
                view === "swipe"
                  ? "bg-brand text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-neutral-800"
              }`}
            >
              ♥ スワイプ
            </button>
            <button
              onClick={() => setView("grid")}
              className={`px-3 py-1.5 font-medium ${
                view === "grid"
                  ? "bg-brand text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-neutral-800"
              }`}
            >
              ▦ 一覧
            </button>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-800"
          >
            絞り込み
            {activeCount > 0 && (
              <span className="ml-1 rounded-full bg-brand px-1.5 text-xs text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 絞り込みパネル（開閉式） */}
      {open && (
        <div className="mb-5 space-y-3 rounded-2xl border bg-white p-4 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          {/* 年齢レンジ */}
          <Field label="年齢">
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={f.ageMin}
                onChange={(e) => set("ageMin", e.target.value)}
                placeholder="下限"
                className="w-20 rounded-lg border px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800"
              />
              <span className="text-gray-400">〜</span>
              <input
                type="number"
                inputMode="numeric"
                value={f.ageMax}
                onChange={(e) => set("ageMax", e.target.value)}
                placeholder="上限"
                className="w-20 rounded-lg border px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="性別">
              <Select value={f.gender} onChange={(v) => set("gender", v)} placeholder="指定なし">
                {Object.entries(GENDER_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="利用目的">
              <Select value={f.purpose} onChange={(v) => set("purpose", v)} placeholder="指定なし">
                {(Object.keys(PURPOSE_LABEL) as Purpose[]).map((v) => (
                  <option key={v} value={v}>
                    {PURPOSE_LABEL[v]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="居住地">
              <Select value={f.location} onChange={(v) => set("location", v)} placeholder="指定なし">
                {locations.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="趣味">
              <Select value={f.interest} onChange={(v) => set("interest", v)} placeholder="指定なし">
                {interests.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="性格タイプ">
              <Select
                value={f.personalityType}
                onChange={(v) => set("personalityType", v)}
                placeholder="指定なし"
              >
                {personalities.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* リセット */}
          {activeCount > 0 && (
            <button
              onClick={() => setF(EMPTY)}
              className="text-sm font-medium text-brand-dark hover:underline"
            >
              条件をクリア
            </button>
          )}
        </div>
      )}

      {/* 結果表示（スワイプ or 一覧） */}
      {filtered.length === 0 ? (
        <p className="py-10 text-center text-gray-500 dark:text-gray-400">
          条件に合う相手がいません。条件をゆるめてみてください。
        </p>
      ) : view === "swipe" ? (
        // key を変えることで、絞り込みが変わったらデッキを最初から引き直す
        <SwipeDeck key={JSON.stringify(f)} items={filtered} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map(({ profile, score }) => (
            <UserCard key={profile.id} profile={profile} score={score} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- 小さな部品 ------------------------------------------------
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800"
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
