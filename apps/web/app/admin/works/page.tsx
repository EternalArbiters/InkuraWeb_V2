import Link from "next/link";

import BackButton from "@/app/components/BackButton";
import AdminWorksClient from "./AdminWorksClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminWorksPage() {
  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
              Admin works
            </div>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">Work category override</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300 md:text-base">
              Search any work and correct its publish type (Original / Translation / Re-upload). Rebuilding community snapshots after changes will update author rankings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/community"
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Community
            </Link>
            <Link
              href="/admin/analytics"
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Analytics
            </Link>
            <BackButton href="/home" />
          </div>
        </div>

        <AdminWorksClient />
      </div>
    </main>
  );
}
