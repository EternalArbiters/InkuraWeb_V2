import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import PageScaffold from "../../components/PageScaffold";

export const dynamic = "force-dynamic";

export default async function HistorySettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/settings/history`)}`);
  }

  const progress = await prisma.readingProgress.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      work: { select: { slug: true, title: true, type: true } },
      chapter: { select: { id: true, number: true, title: true } },
    },
  });

  return (
    <PageScaffold
      title="History Reading"
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "History", href: "/settings/history" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        {progress.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            There's no history yet. Open one chapter first.
          </p>
        ) : (
          <div className="space-y-2">
            {progress.map((p) => (
              <Link
                key={p.workId}
                href={`/w/${p.work.slug}/read/${p.chapterId}`}
                className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div className="font-semibold">{p.work.title}</div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  {p.work.type} • Chapter {p.chapter?.number}: {p.chapter?.title}
                </div>
                {p.progress != null ? (
                  <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300">
                    Progress: <b>{Math.round(p.progress * 100)}%</b>
                  </div>
                ) : null}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/library"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110"
          >
            Open Library
          </Link>
          <Link
            href="/home"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
