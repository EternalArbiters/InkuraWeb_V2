import { redirect } from "next/navigation";

import WorksGrid from "@/app/components/WorksGrid";
import ListSurface from "@/app/components/ListSurface";
import BrowsePageChrome from "@/app/browse/_components/BrowsePageChrome";
import { requireAdmin } from "@/server/auth/requireUser";
import { listDraftWorksForAdmin } from "@/server/services/works/listDraftWorks";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export const dynamic = "force-dynamic";

export default async function StillDraftPage() {
  try {
    await requireAdmin();
  } catch (error: any) {
    const message = String(error?.message || "");
    if (message === "UNAUTHORIZED") {
      redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/browse/still-drafts")}`);
    }
    redirect("/home");
  }

  const works = await listDraftWorksForAdmin({ take: 80 });
  const [title, emptyLabel, searchLabel] = await Promise.all([
    getActiveUILanguageText("Still Draft", { section: "Page Home" }),
    getActiveUILanguageText("No items.", { section: "Page Home" }),
    getActiveUILanguageText("Advanced search"),
  ]);

  return (
    <ListSurface>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <BrowsePageChrome title={title} count={works.length} searchLabel={searchLabel} />

        <div className="mt-7">
          {works.length ? (
            <WorksGrid works={works as any[]} showBookmarkButton showUpdatedSubtitle />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              {emptyLabel}
            </div>
          )}
        </div>
      </div>
    </ListSurface>
  );
}
