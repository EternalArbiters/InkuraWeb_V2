import { redirect } from "next/navigation";

import WorksGrid from "@/app/components/WorksGrid";
import ListSurface from "@/app/components/ListSurface";
import BrowsePageChrome from "@/app/browse/_components/BrowsePageChrome";
import { requireAdminOrSpecialUser } from "@/server/auth/requireUser";
import { getViewerBasic } from "@/server/services/works/viewer";
import { listAdminCollectionWorks } from "@/server/services/works/listAdminCollectionWorks";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export const dynamic = "force-dynamic";

export default async function AdminCollectionPage() {
  try {
    await requireAdminOrSpecialUser();
  } catch (error: any) {
    const message = String(error?.message || "");
    if (message === "UNAUTHORIZED") {
      redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/browse/admin-collection")}`);
    }
    redirect("/home");
  }

  // v30: still apply mature/Deviant Love filtering here — passing requireAdminOrSpecialUser()
  // is only proof of ADMIN/SPECIAL_USER role, not proof the viewer can see mature content.
  const viewer = await getViewerBasic();
  const works = await listAdminCollectionWorks({ take: 80, viewer });
  const [title, emptyLabel, searchLabel] = await Promise.all([
    getActiveUILanguageText("Admin Collection", { section: "Page Home" }),
    getActiveUILanguageText("No items.", { section: "Page Home" }),
    getActiveUILanguageText("Advanced search"),
  ]);

  return (
    <ListSurface>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <BrowsePageChrome title={title} count={works.length} searchLabel={searchLabel} />

        <div className="mt-10">
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
