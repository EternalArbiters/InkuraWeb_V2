import { redirect } from "next/navigation";

import ActionLink from "@/app/components/ActionLink";
import WorksGrid from "@/app/components/WorksGrid";
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
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
          </div>
          <ActionLink href="/search">{searchLabel}</ActionLink>
        </div>

        <div className="mt-7">
          {works.length ? (
            <WorksGrid works={works as any[]} showBookmarkButton showUpdatedSubtitle />
          ) : (
            <div className="border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              {emptyLabel}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
