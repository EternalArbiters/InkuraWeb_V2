import Link from "next/link";
import { redirect } from "next/navigation";
import AdminReportsClient from "./AdminReportsClient";
import { apiJson } from "@/server/http/apiJson";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const res = await apiJson<{ reports: any[] }>("/api/admin/reports");
  if (!res.ok) {
    redirect("/home");
  }

  const initial = (res.data.reports || []).map((r: any) => ({
    id: r.id,
    createdAt: r.createdAt,
    reason: r.reason,
    reporter: r.reporter,
    targetId: r.targetId,
    comment: r.comment
      ? {
          ...r.comment,
          createdAt: r.comment.createdAt,
        }
      : null,
  }));

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Admin Reports</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/taxonomy"
              className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Taxonomy
            </Link>
            <Link
              href="/admin/notify"
              className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Notify user
            </Link>
            <Link
              href="/home"
              className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Back
            </Link>
          </div>
        </div>

        <AdminReportsClient initial={initial as any} />
      </div>
    </main>
  );
}
