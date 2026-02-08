import Link from "next/link";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AllPage() {
  const session = await getServerSession(authOptions);
  const user = session
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { matureOptIn: true } })
    : null;
  const canViewMature = !!user?.matureOptIn;

  const works = await prisma.work.findMany({
    where: { status: "PUBLISHED", ...(canViewMature ? {} : { isMature: false }) },
    orderBy: { updatedAt: "desc" },
    take: 24,
    select: {
      id: true,
      slug: true,
      title: true,
      coverImage: true,
      type: true,
      isMature: true,
      likeCount: true,
      ratingAvg: true,
      ratingCount: true,
      author: { select: { username: true, name: true } },
    },
  });

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Explore</h1>

        {!canViewMature ? (
          <div className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/30 p-4 text-sm">
            NSFW content will not be displayed to minors and those who do not want it.
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {works.map((w) => (
            <Link
              key={w.id}
              href={`/w/${w.slug}`}
              className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 overflow-hidden hover:shadow-lg transition"
            >
              <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-800 relative">
                {w.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.coverImage} alt={w.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition" />
                ) : null}
                {w.isMature ? (
                  <div className="absolute top-2 left-2 text-[11px] font-bold px-2 py-1 rounded-lg bg-black/70 text-white">
                    18+
                  </div>
                ) : null}
              </div>
              <div className="p-3">
                <div className="text-sm font-bold leading-snug line-clamp-2">{w.title}</div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  {w.type} • {w.author.name || w.author.username}
                </div>
                <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-3">
                  <span> {w.likeCount}</span>
                  <span>⭐ {(Math.round(w.ratingAvg * 10) / 10).toFixed(1)} ({w.ratingCount})</span>
                </div>
              </div>
            </Link>
          ))}

          {works.length === 0 ? (
            <div className="col-span-2 md:col-span-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
              <div className="text-lg font-bold">There are no works yet</div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Masuk dulu, lalu buat karya dari{" "}
                <Link className="text-purple-600 dark:text-purple-400 font-semibold hover:underline" href="/studio">
                  Studio
                </Link>.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
