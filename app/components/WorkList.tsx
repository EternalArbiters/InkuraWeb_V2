import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";

const db = prisma as any;

export default async function WorkList({ type }: { type?: "NOVEL" | "COMIC" | "FILM" }) {
  const session = await getServerSession(authOptions);
  const adult = Boolean((session as any)?.user?.adultConfirmed);

  const works = await db.work.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(adult ? {} : { nsfw: false }),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      creator: { select: { username: true, name: true } },
    },
  });

  if (!works.length) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-600 dark:text-gray-300">
        Belum ada karya.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {works.map((w) => (
        <div
          key={w.id}
          className="rounded-xl bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden"
        >
          <div className="h-40 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {w.coverDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={w.coverDataUrl} alt={w.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-xs text-gray-500">No cover</div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">
                  {w.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {w.type} • {w.creator?.name || w.creator?.username}
                </p>
              </div>
              {w.nsfw && (
                <span className="shrink-0 inline-flex items-center justify-center px-2 py-1 text-[11px] font-semibold rounded-md bg-red-600 text-white">
                  18+
                </span>
              )}
            </div>

            <p className="mt-2 text-sm text-gray-700 dark:text-gray-200 line-clamp-3">
              {w.description}
            </p>

            {!!w.genres && (
              <div className="mt-3 flex flex-wrap gap-2">
                {w.genres
                  .split(",")
                  .map((g) => g.trim())
                  .filter(Boolean)
                  .slice(0, 6)
                  .map((g) => (
                    <span
                      key={g}
                      className="inline-flex items-center justify-center px-2 py-1 rounded-md text-[11px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                    >
                      {g}
                    </span>
                  ))}
              </div>
            )}

            <div className="mt-4 text-[11px] text-gray-500 dark:text-gray-400">
              Dipost sebagai: <span className="font-semibold">{w.postingRole}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
