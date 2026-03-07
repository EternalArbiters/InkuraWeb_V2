import ActionLink from "@/app/components/ActionLink";
import WorkRowCard from "@/app/components/work/WorkRowCard";
import { listPublishedWorksFromSearchParams } from "@/server/services/works/listPublishedWorks";

type Props = {
  title: string;
  qs: string;
  emptyText?: string;
};

export default async function BrowseListPage({ title, qs, emptyText }: Props) {
  let works: any[] = [];

  try {
    works = (await listPublishedWorksFromSearchParams(new URLSearchParams(qs))).works;
  } catch {
    works = [];
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
          </div>
          <ActionLink href="/search">Advanced search</ActionLink>
        </div>

        <div className="mt-7 space-y-3">
          {works?.length ? (
            works.map((w) => <WorkRowCard key={w.id} work={w} />)
          ) : (
            <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-sm text-gray-600 dark:text-gray-300">
              {emptyText || "No items."}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
