import Link from "next/link";
import NotificationsClient from "./NotificationsClient";
import { apiJson } from "@/server/http/apiJson";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const res = await apiJson<{ notifications: any[] }>("/api/notifications");
  const notifications = res.ok ? res.data.notifications : [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Notifications</h1>
          </div>
          <Link
            href="/all"
            className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Back
          </Link>
        </div>

        <NotificationsClient initial={notifications as any} />
      </div>
    </main>
  );
}
