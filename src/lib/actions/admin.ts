"use server";
// =============================================================
// 管理者用 Server Action：通報ステータス更新
//   実際の権限チェックは RLS の reports_update_admin が担保する。
//   （管理者以外が呼んでも 0 行更新で終わる）
// =============================================================
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateReportStatus(formData: FormData) {
  const reportId = String(formData.get("reportId"));
  const status = String(formData.get("status"));
  if (!["reviewing", "resolved"].includes(status)) return;

  const supabase = await createClient();
  await supabase.from("reports").update({ status }).eq("id", reportId);

  revalidatePath("/admin/reports");
}
