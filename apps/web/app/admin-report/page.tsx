import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminReportClient from "@/app/admin-report/ui/AdminReportClient";
import { isAdminEmail } from "@/server/auth/adminEmail";

export const runtime = "nodejs";

export default async function AdminReportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/admin-report`)}`);

  const initialIsAdmin = (session.user as any)?.role === "ADMIN" && isAdminEmail((session.user as any)?.email);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Admin Report</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {initialIsAdmin
              ? "Inbox reports from users."
              : "Send a report/issue to the admin. (Not for illegal requests, okay? 😅)"}
          </p>
        </div>

        <AdminReportClient initialIsAdmin={initialIsAdmin} />
      </div>
    </main>
  );
}
