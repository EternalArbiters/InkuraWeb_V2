import BackButton from "@/app/components/BackButton";
import Link from "next/link";
import AdminNotifyClient from "./AdminNotifyClient";

export default function AdminNotifyPage() {
  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Notify user</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Send a direct notification to a specific user.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/reports"
              className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Reports
            </Link>
            <BackButton href="/home" />
          </div>
        </div>

        <AdminNotifyClient />
      </div>
    </main>
  );
}
