import Link from "next/link";
import { redirect } from "next/navigation";

import WorkCardSquare from "@/app/home/WorkCardSquare";
import { getSession } from "@/server/auth/session";
import prisma from "@/server/db/prisma";

export const dynamic = "force-dynamic";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function profileName(user: { name: string | null; username: string | null; email: string }) {
  return user.name || user.username || user.email.split("@")[0] || "User";
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  const userId = session.user.id;

  const [profile, publishedWorksCount, publicListsCount, reviewsCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        image: true,
        avatarFocusX: true,
        avatarFocusY: true,
        avatarZoom: true,
        createdAt: true,
        works: {
          where: { status: "PUBLISHED" },
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: {
            id: true,
            slug: true,
            title: true,
            coverImage: true,
            updatedAt: true,
            type: true,
            comicType: true,
            likeCount: true,
            ratingAvg: true,
            ratingCount: true,
            isMature: true,
            language: true,
            completion: true,
            chapterCount: true,
            publishType: true,
            author: { select: { name: true, username: true } },
          },
        },
        readingLists: {
          where: { isPublic: true },
          orderBy: { updatedAt: "desc" },
          take: 6,
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            updatedAt: true,
            _count: { select: { items: true } },
          },
        },
        reviews: {
          orderBy: { updatedAt: "desc" },
          take: 6,
          select: {
            id: true,
            rating: true,
            title: true,
            body: true,
            createdAt: true,
            updatedAt: true,
            work: {
              select: {
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
    prisma.work.count({ where: { authorId: userId, status: "PUBLISHED" } }),
    prisma.readingList.count({ where: { ownerId: userId, isPublic: true } }),
    prisma.review.count({ where: { userId } }),
  ]);

  if (!profile) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  const displayName = profileName(profile);
  const avatar = profile.image || "/images/default-avatar.png";
  const avatarFocusX = Number.isFinite(Number(profile.avatarFocusX)) ? Number(profile.avatarFocusX) : 50;
  const avatarFocusY = Number.isFinite(Number(profile.avatarFocusY)) ? Number(profile.avatarFocusY) : 50;
  const avatarZoom = Number.isFinite(Number(profile.avatarZoom)) ? Math.max(1, Number(profile.avatarZoom)) : 1;

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <section className="rounded-[28px] border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#04112b] p-6 md:p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4 min-w-0">
              <div className="relative h-20 w-20 md:h-24 md:w-24 shrink-0 rounded-full overflow-hidden border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt={displayName}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    objectPosition: `${avatarFocusX}% ${avatarFocusY}%`,
                    transform: `scale(${avatarZoom})`,
                    transformOrigin: "center",
                  }}
                />
              </div>

              <div className="min-w-0">
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight break-words">{displayName}</div>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 break-all">
                  {profile.username ? `@${profile.username}` : profile.email}
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-all">{profile.email}</div>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Joined {formatDate(profile.createdAt)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 md:justify-end">
              <Link
                href="/settings/profile"
                className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110"
              >
                Edit Profile
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 md:max-w-xl">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 p-4">
              <div className="text-2xl font-extrabold">{publishedWorksCount}</div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Published works</div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 p-4">
              <div className="text-2xl font-extrabold">{publicListsCount}</div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Public lists</div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/50 p-4">
              <div className="text-2xl font-extrabold">{reviewsCount}</div>
              <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Reviews</div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#04112b] p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Published Works</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Works you have published on Inkura.</p>
            </div>
          </div>

          {profile.works.length ? (
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
              {profile.works.map((work) => (
                <WorkCardSquare key={work.id} work={work} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
              No published works yet.
            </div>
          )}
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#04112b] p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Public Reading Lists</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Lists you have shared with other readers.</p>
            </div>

            {profile.readingLists.length ? (
              <div className="mt-5 grid gap-3">
                {profile.readingLists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/lists/${list.slug}`}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 p-4 hover:bg-gray-100 dark:hover:bg-gray-900/70 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{list.title}</div>
                        {list.description ? (
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{list.description}</div>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-xs rounded-full px-2 py-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                        {list._count.items} items
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Updated {formatDate(list.updatedAt)}</div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
                No public reading lists yet.
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#04112b] p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Recent Reviews</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Your latest ratings and short reviews.</p>
            </div>

            {profile.reviews.length ? (
              <div className="mt-5 grid gap-3">
                {profile.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Link href={review.work?.slug ? `/w/${review.work.slug}` : "#"} className="font-semibold hover:underline truncate">
                        {review.work?.title || "Untitled work"}
                      </Link>
                      <div className="shrink-0 text-sm font-semibold">★ {review.rating.toFixed(1)}</div>
                    </div>
                    {review.title ? <div className="mt-2 text-sm font-semibold">{review.title}</div> : null}
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 line-clamp-3 whitespace-pre-wrap">{review.body}</div>
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">{formatDate(review.updatedAt || review.createdAt)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
                No reviews yet.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
