"use client";
// =============================================================
// ブロック・通報メニュー（クライアントコンポーネント）
//   MVPでは最小UI。Server Action を呼ぶだけ。
// =============================================================
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { blockUser, reportUser } from "@/lib/actions/moderation";

export function BlockReportMenu({ targetId }: { targetId: string }) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  function handleBlock() {
    if (!confirm("このユーザーをブロックしますか？")) return;
    startTransition(async () => {
      const res = await blockUser(targetId);
      if (res.ok) router.push("/discover"); // 以降は表示されなくなる
      else setMsg(res.error);
    });
  }

  function handleReport() {
    const reason = prompt("通報の理由を入力してください");
    if (!reason) return;
    startTransition(async () => {
      const res = await reportUser(targetId, reason);
      setMsg(res.ok ? "通報を受け付けました" : res.error);
    });
  }

  return (
    <div className="flex gap-4 text-sm text-gray-500">
      <button onClick={handleBlock} disabled={isPending} className="hover:text-gray-800">
        ブロック
      </button>
      <button onClick={handleReport} disabled={isPending} className="hover:text-gray-800">
        通報
      </button>
      {msg && <span className="text-gray-600">{msg}</span>}
    </div>
  );
}
