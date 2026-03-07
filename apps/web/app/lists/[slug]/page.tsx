import Link from "next/link";
import { notFound } from "next/navigation";
import { getReadingListPageDataBySlug } from "@/server/services/readingLists/readingLists";
import ShareButton from "@/app/components/work/ShareButton";
import ListOwnerControls from "./ownerControls";
import ListWorksGrid from "./listWorksGrid";
import PublicUserLink from "@/app/components/user/PublicUserLink";

export const dynamic = "force-dynamic";

export default async function ReadingListPublicPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;

  const data = await getReadingListPageDataBySlug(params.slug);
  if (!data.ok) return notFound();

  const list = data.list;
  const items = Array.isArray(data.items) ? data.items : [];
  const viewer = data.viewer;

  const isOwner = !!viewer?.isOwner;

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight truncate">{list.title}</h1>
              <span
                className={
                  "text-[11px] px-2 py-1 rounded-full " +
                  (list.isPublic ? "bg-emerald-600 text-white" : "border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200")
                }
              >
                {list.isPublic ? "PUBLIC" : "PRIVATE"}
              </span>
            </div>

            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              by <b><PublicUserLink user={list?.owner} className="hover:text-purple-400" /></b> • {items.length} item
            </div>

            {list.description ? <p className="mt-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{list.description}</p> : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <ShareButton title={list.title} />
              <Link
                href="/lists"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                My lists
              </Link>
            </div>
          </div>

          {isOwner ? (
            <div className="w-full md:w-[360px]">
              <ListOwnerControls
                listId={list.id}
                initialTitle={list.title}
                initialDescription={list.description || ""}
                initialPublic={!!list.isPublic}
              />
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          <ListWorksGrid
            listId={list.id}
            isOwner={isOwner}
            items={items}
          />
        </div>

        {!items.length ? (
          <div className="mt-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-8">
            <div className="text-lg font-extrabold">List kosong</div>
            {isOwner ? (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Tambahkan work dari halaman work (pakai tombol “Add to List”) atau cari work lewat Search.
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">There is no work to show yet.</p>
            )}
            {isOwner ? (
              <div className="mt-4">
                <Link
                  href="/search"
                  className="inline-flex px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110"
                >
                  Browse works
                </Link>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
