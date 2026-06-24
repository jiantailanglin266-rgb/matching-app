"use client";
// =============================================================
// 簡易ログイン画面（メールのマジックリンク方式）
//   本番では UI を作り込んでください。ここは動作確認用の最小実装。
// =============================================================
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    // メールにログインリンクを送る（パスワード不要）
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/discover` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  if (sent) {
    return <p className="text-center">📩 {email} にログインリンクを送りました。</p>;
  }

  return (
    <form onSubmit={handleLogin} className="mx-auto max-w-sm space-y-4">
      <h1 className="text-xl font-bold">ログイン</h1>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded border px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
      />
      <button className="w-full rounded bg-brand py-2 font-bold text-white">
        ログインリンクを送る
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
