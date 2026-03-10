import ActionLink from "@/app/components/ActionLink";
import InteractiveWorkCard from "@/app/components/work/InteractiveWorkCard";
import { listPublishedWorksFromSearchParams } from "@/server/services/works/listPublishedWorks";

type Props = {
  title: string;
  qs: string;
  emptyText?: string;
  showBookmarkButton?: boolean;
  showUpdatedSubtitle?: boolean;
};

export default async function BrowseListPage({
  title,
  qs,
  emptyText,
  showBookmarkButton = false,
  showUpdatedSubtitle = false,
}: Props) {
  let works: any[] = [];

  try {
    works = (await listPublishedWorksFromSearchParams(new URLSearchParams(qs))).works;
  } catch {
    works = [];
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
          </div>
          <ActionLink href="/search">Advanced search</ActionLink>
        </div>

        <div className="mt-7">
          {works?.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {works.map((work) => (
                <InteractiveWorkCard
                  key={work.id}
                  work={work}
                  showBookmarkButton={showBookmarkButton}
                  showUpdatedSubtitle={showUpdatedSubtitle}
                />
              ))}
            </div>
          ) : (
            <div className="border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
              {emptyText || "No items."}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
