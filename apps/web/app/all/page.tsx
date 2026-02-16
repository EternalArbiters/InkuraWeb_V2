import Link from "next/link";
import WorksGrid from "../components/WorksGrid";
import { apiJson } from "@/lib/serverApi";

export const dynamic = "force-dynamic";

export default async function AllWorksPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ sort?: string; publishType?: string; author?: string; translator?: string }>;
}) {
  const sp = await searchParamsPromise;

  const sort = (sp.sort || "newest").toLowerCase();
  const publishType = (sp.publishType || "").toUpperCase();
  const author = (sp.author || "").trim();
  const translator = (sp.translator || "").trim();

  const qs = new URLSearchParams();
  qs.set("take", "48");
  if (sort && sort !== "newest") qs.set("sort", sort);
  if (publishType === "ORIGINAL" || publishType === "TRANSLATION" || publishType === "REUPLOAD") qs.set("publishType", publishType);
  if (author) qs.set("author", author);
  if (translator) qs.set("translator", translator);

  const res = await apiJson<{ works: any[] }>(`/api/works?${qs.toString()}`);
  const works = res.ok ? res.data.works : [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">All Works</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Filter: publish type, author, translator.</p>
          </div>
          <Link href="/search" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
            Advanced search →
          </Link>
        </div>

        <form action="/all" method="get" className="mt-6 grid grid-cols-1 md:grid-cols-[160px_200px_1fr_1fr_140px] gap-3">
          <select
            name="sort"
            defaultValue={sort}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          >
            <option value="newest">Newest</option>
            <option value="liked">Most liked</option>
            <option value="rated">Best rated</option>
          </select>

          <select
            name="publishType"
            defaultValue={publishType}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          >
            <option value="">Any publish type</option>
            <option value="ORIGINAL">Original</option>
            <option value="TRANSLATION">Translation</option>
            <option value="REUPLOAD">Reupload</option>
          </select>

          <input
            name="author"
            defaultValue={author}
            placeholder="Author (username / name)"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
          />

          <input
            name="translator"
            defaultValue={translator}
            placeholder="Translator (username / name)"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 hover:brightness-110">
            Apply
          </button>
        </form>

        <div className="mt-8">
          <WorksGrid works={works as any} />
        </div>
      </div>
    </main>
  );
}
