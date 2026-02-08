import Link from "next/link";
import prisma from "@/lib/prisma";
import PageScaffold from "../components/PageScaffold";

export const dynamic = "force-dynamic";

export default async function GenrePage() {
  const genres = await prisma.genre.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { works: true } },
    },
  });

  return (
    <PageScaffold
      title="Genre"
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Genre", href: "/genre" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Select a genre</h2>
          </div>
          <Link
            href="/search"
            className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
          >
            Open Search
          </Link>
        </div>

        {genres.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Belum ada genre. Tambahin lewat seed / studio.</p>
        ) : (
          <ul className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {genres.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/search?genre=${encodeURIComponent(g.slug)}`}
                  className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="font-semibold">{g.name}</span>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{g._count.works}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/all"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110"
          >
            Explore All
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
