import Link from "next/link";
import { apiJson } from "@/server/http/apiJson";
import WorkRail from "./WorkRail";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [trendingComicsRes, trendingNovelsRes, recentRes, originalsRes, translationsRes] = await Promise.all([
    apiJson<{ works: any[] }>("/api/works?type=COMIC&sort=liked&take=20"),
    apiJson<{ works: any[] }>("/api/works?type=NOVEL&sort=liked&take=20"),
    apiJson<{ works: any[] }>("/api/works?sort=newest&take=20"),
    apiJson<{ works: any[] }>("/api/works?publishType=ORIGINAL&sort=newest&take=20"),
    apiJson<{ works: any[] }>("/api/works?publishType=TRANSLATION&sort=newest&take=20"),
  ]);

  const trendingComics = trendingComicsRes.ok ? trendingComicsRes.data.works : [];
  const trendingNovels = trendingNovelsRes.ok ? trendingNovelsRes.data.works : [];
  const recent = recentRes.ok ? recentRes.data.works : [];
  const originals = originalsRes.ok ? originalsRes.data.works : [];
  const translations = translationsRes.ok ? translationsRes.data.works : [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Home</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-md hover:brightness-110 transition"
            >
              Search
            </Link>
            <Link
              href="/library"
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-md hover:brightness-110 transition"
            >
              Library
            </Link>
          </div>
        </header>

        <WorkRail title="Trending Comics" href="/browse/trending-comics" works={trendingComics} />
        <WorkRail title="Trending Novels" href="/browse/trending-novels" works={trendingNovels} />
        <WorkRail title="New Originals" href="/browse/new-originals" works={originals} />
        <WorkRail title="Latest Translations" href="/browse/latest-translations" works={translations} />
        <WorkRail title="Recently Updated" href="/browse/recent-updates" works={recent} />

        <footer className="pt-6 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
          Inkura v16
        </footer>
      </div>
    </main>
  );
}
