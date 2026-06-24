// =============================================================
// ユーザー詳細プロフィール画面
//   RLSにより、ブロック関係や凍結中の相手はそもそも取得できない
//   （= notFound 扱い）。安全はDB側で担保される。
// =============================================================
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { LikeButton } from "@/components/LikeButton";
import { BlockReportMenu } from "@/components/BlockReportMenu";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { purposeLabel, genderLabel } from "@/lib/labels";
import { DEMO_MODE, DEMO_ME, DEMO_PROFILES } from "@/lib/demo";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ▼ デモモード
  if (DEMO_MODE) {
    const demoProfile = [DEMO_ME, ...DEMO_PROFILES].find((p) => p.id === id);
    if (!demoProfile) notFound();
    return <ProfileView profile={demoProfile} isSelf={id === DEMO_ME.id} />;
  }
  // ▲

  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle<Profile>();

  if (!profile) notFound(); // RLSで弾かれた場合もここに来る

  return <ProfileView profile={profile} isSelf={id === user.id} />;
}

// プロフィール詳細の見た目（通常・デモ共用）
function ProfileView({ profile, isSelf }: { profile: Profile; isSelf: boolean }) {
  return (
    <div className="-mt-1">
      {/* 写真（大・カルーセル） */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-sm">
        <PhotoCarousel profile={profile} />
        {/* 下部グラデ＋名前 */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-5 pt-12">
          <h1 className="text-3xl font-extrabold text-white drop-shadow">
            {profile.display_name}
            {profile.age != null && (
              <span className="ml-2 text-xl font-semibold">{profile.age}</span>
            )}
          </h1>
          <p className="mt-0.5 text-sm text-white/90">
            📍 {profile.location ?? "居住地未設定"}
            {genderLabel(profile.gender) && <> ・ {genderLabel(profile.gender)}</>}
          </p>
        </div>
      </div>

      <div className="space-y-5 px-1 py-5">
        {/* 自己紹介 */}
        {profile.bio && (
          <section>
            <h2 className="mb-1.5 text-sm font-bold text-gray-400">自己紹介</h2>
            <p className="whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
          </section>
        )}

        {/* 趣味 */}
        {profile.interests.length > 0 && (
          <section>
            <h2 className="mb-1.5 text-sm font-bold text-gray-400">趣味・興味</h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-pink-50 px-3 py-1 text-sm text-brand-dark dark:bg-brand/15 dark:text-pink-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 基本情報（診断モジュール由来含む） */}
        <section>
          <h2 className="mb-1.5 text-sm font-bold text-gray-400">基本情報</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {purposeLabel(profile.purpose) && (
              <Info label="利用目的" value={purposeLabel(profile.purpose)!} />
            )}
            {profile.personality_type && (
              <Info label="性格タイプ" value={profile.personality_type} />
            )}
            {profile.character_type && <Info label="キャラ" value={profile.character_type} />}
          </dl>
        </section>
      </div>

      {/* 自分自身にはアクションを出さない */}
      {!isSelf && (
        <>
          {/* 下部固定のいいねバー */}
          <div className="fixed inset-x-0 bottom-14 z-10 border-t bg-white/95 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/95">
            <div className="mx-auto max-w-2xl px-4 py-3">
              <LikeButton toUserId={profile.id} />
            </div>
          </div>
          {/* バー高さ分の余白 + 通報/ブロック */}
          <div className="pb-24">
            <BlockReportMenu targetId={profile.id} />
          </div>
        </>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gray-100 px-3 py-2 dark:bg-neutral-800">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
