import WorksGrid from "@/app/components/WorksGrid";
import ListSurface from "@/app/components/ListSurface";
import BrowsePageChrome from "./BrowsePageChrome";
import { listPublishedWorksFromSearchParams } from "@/server/services/works/listPublishedWorks";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

type Props = {
  title: string;
  qs: string;
  emptyText?: string;
  showBookmarkButton?: boolean;
  showUpdatedSubtitle?: boolean;
  publishedOnly?: boolean;
};

export default async function BrowseListPage({
  title,
  qs,
  emptyText,
  showBookmarkButton = false,
  showUpdatedSubtitle = false,
  publishedOnly = false,
}: Props) {
  let works: any[] = [];

  try {
    const params = new URLSearchParams(qs);
    params.set("ignoreLang", "1");
    works = (await listPublishedWorksFromSearchParams(params, { forcePublishedOnly: publishedOnly })).works;
  } catch {
    works = [];
  }

  const tAdvancedSearch = await getActiveUILanguageText("Advanced search");

  return (
    <ListSurface>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <BrowsePageChrome title={title} count={works.length} searchLabel={tAdvancedSearch} />

        <div className="mt-7">
          {works?.length ? (
            <WorksGrid
              works={works}
              showBookmarkButton={showBookmarkButton}
              showUpdatedSubtitle={showUpdatedSubtitle}
            />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              {emptyText || "No items."}
            </div>
          )}
        </div>
      </div>
    </ListSurface>
  );
}
