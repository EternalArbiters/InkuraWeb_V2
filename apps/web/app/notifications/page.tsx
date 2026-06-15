import BackButton from "@/app/components/BackButton";
import NotificationsClient from "./NotificationsClient";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import { listViewerNotifications } from "@/server/services/notifications/viewerNotifications";
import ListSurface from "@/app/components/ListSurface";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  await requirePageUserId("/notifications");
  const { notifications } = await listViewerNotifications();
  const tNotifications = await getActiveUILanguageText("Notifications");

  return (
    <ListSurface>
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{tNotifications}</h1>
          </div>
          <BackButton href="/all" />
        </div>

        <NotificationsClient initial={notifications as any} />
      </div>
    </ListSurface>
  );
}
