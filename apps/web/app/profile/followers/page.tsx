import Link from "next/link";
import ConnectionUserCard from "@/app/components/user/ConnectionUserCard";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { getViewerConnectionsPageData } from "@/server/services/profile/follows";
import LoadMoreList from "@/app/components/LoadMoreList";

export const dynamic = "force-dynamic";

export default async function ProfileFollowersPage() {
  const userId = await requirePageUserId("/profile/followers");
  const data = await getViewerConnectionsPageData(userId, "followers");
  if (!data) return null;
  const [tFollowers, tBack, tNoFollowers] = await Promise.all([
    getActiveUILanguageText("Followers"),
    getActiveUILanguageText("Back"),
    getActiveUILanguageText("No followers yet.", { section: "Page Followers" }),
  ]);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
<h1 className="text-3xl font-extrabold tracking-tight">{tFollowers}</h1>
          </div>
          <Link href="/profile" className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">{tBack}</Link>
        </div>

        {data.items.length ? (
          <LoadMoreList className="mt-6 grid gap-3">
            {data.items.map((item) => (
              <ConnectionUserCard key={`${item.user.id}-${item.createdAt}`} user={item.user} />
            ))}
          </LoadMoreList>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
            {tNoFollowers}
          </div>
        )}
      </div>
    </main>
  );
}
