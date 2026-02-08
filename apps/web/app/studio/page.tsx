import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/studio")}`);
  }

  const works = await prisma.work.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      coverImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Creator Studio</h1>
          </div>

          <Link
            href="/studio/new"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110"
          >
            + Create New Work
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {works.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
              <h2 className="text-xl font-bold">There are no works yet</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Click the <b>"Create New Work"</b> button to get started.
              </p>
            </div>
          ) : null}

          {works.map((w) => (
            <div
              key={w.id}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 flex gap-4"
            >
              <div className="w-20 h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 flex items-center justify-center">
                {w.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.coverImage} alt={w.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs opacity-60">No Cover</span>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold leading-snug">{w.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {w.type} • {w.status}
                    </p>
                  </div>
                  <Link
                    href={`/studio/works/${w.id}`}
                    className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Kelola
                  </Link>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/work/${w.id}`}
                    className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Lihat Detail
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
