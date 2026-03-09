import BackButton from "@/app/components/BackButton";
import NotificationsClient from "./NotificationsClient";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { listViewerNotifications } from "@/server/services/notifications/viewerNotifications";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  await requirePageUserId("/notifications");
  const { notifications } = await listViewerNotifications();

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Notifications</h1>
          </div>
          <BackButton href="/all" />
        </div>

        <NotificationsClient initial={notifications as any} />
      </div>
    </main>
  );
}
