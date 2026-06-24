// =============================================================
// 管理者用：通報確認画面
//   RLS の reports_select / reports_update_admin により、
//   管理者(user_metadata.role='admin')だけが閲覧・更新できる。
//   管理者以外がアクセスしても 0 件になる（情報は漏れない）。
// =============================================================
import { requireUser } from "@/lib/supabase/server";
import { updateReportStatus } from "@/lib/actions/admin";

// 通常運用では requireUser() が cookies() を使うため自動的に動的レンダリングになる。

type ReportRow = {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  status: "pending" | "reviewing" | "resolved";
  created_at: string;
};

export default async function AdminReportsPage() {
  const { supabase, user } = await requireUser();

  // 念のためサーバー側でも管理者チェック（RLSが本丸の防御）
  const isAdmin = (user.user_metadata as { role?: string })?.role === "admin";
  if (!isAdmin) {
    return <p className="text-red-600">この画面は管理者専用です。</p>;
  }

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<ReportRow[]>();

  const list = reports ?? [];

  return (
    <div>
      <h1 className="mb-4 text-lg font-bold">通報一覧（管理者）</h1>
      {list.length === 0 ? (
        <p className="text-gray-600">通報はありません。</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">通報対象</th>
              <th>理由</th>
              <th>状態</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className="border-b align-top">
                <td className="py-2 font-mono text-xs">{r.reported_id.slice(0, 8)}…</td>
                <td className="max-w-[12rem]">{r.reason}</td>
                <td>{r.status}</td>
                <td>
                  {/* Server Action をフォームで呼ぶ（クライアントJS不要） */}
                  <form action={updateReportStatus} className="flex gap-1">
                    <input type="hidden" name="reportId" value={r.id} />
                    <button name="status" value="reviewing" className="text-blue-600">
                      確認中
                    </button>
                    <button name="status" value="resolved" className="text-green-600">
                      対応済
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
