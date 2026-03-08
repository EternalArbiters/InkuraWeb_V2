import { notFound } from "next/navigation";
import { getReadingListPageDataBySlug } from "@/server/services/readingLists/readingLists";
import { logPageRenderMetric } from "@/server/observability/metrics";
import ListPageShell from "./ListPageShell";

export const dynamic = "force-dynamic";

export default async function ReadingListPublicPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const startedAt = Date.now();
  let slug = "";

  try {
    const params = await paramsPromise;
    slug = params.slug;

    const data = await getReadingListPageDataBySlug(params.slug);
  if (!data.ok) return notFound();

  const list = data.list;
  const items = Array.isArray(data.items) ? data.items : [];
  const viewer = data.viewer;

  const isOwner = !!viewer?.isOwner;

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <ListPageShell initialList={list} initialItems={items} isOwner={isOwner} />
      </div>
    </main>
  );
  } finally {
    logPageRenderMetric("reading-list.public", startedAt, { slug });
  }
}
