import Link from "next/link";
import { redirect } from "next/navigation";

import WorkCardSquare from "@/app/home/WorkCardSquare";
import ActionLink from "@/app/components/ActionLink";
import CollectionRailCard from "@/app/components/user/CollectionRailCard";
import ProfileCommentCard from "@/app/components/user/ProfileCommentCard";
import ProfileReviewCard from "@/app/components/user/ProfileReviewCard";
import ProfileLinksSheet from "@/app/components/user/ProfileLinksSheet";
import ProfileShareButton from "@/app/components/user/ProfileShareButton";
import { parseProfileLinks } from "@/lib/profileUrls";
import { getSession } from "@/server/auth/session";
import prisma from "@/server/db/prisma";
import { getViewerComments, getViewerReviews } from "@/server/services/profile/viewerActivity";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

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

function PublishedWorksRail({ title, works }: { title: string; works: any[] }) {
  if (!works.length) return null;

  return (
    <div className="mt-6 first:mt-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg md:text-xl font-extrabold tracking-tight">{title}</h3>
        <div className="text-xs font-medium uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400">
          {works.length} work{works.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto overscroll-x-contain no-scrollbar -mx-4 px-4">
        <div className="flex w-max gap-3 md:gap-4 snap-x snap-mandatory">
          {works.map((work) => (
            <WorkCardSquare key={work.id} work={work} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileStat({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const content = (
    <div className="min-w-0 rounded-2xl border border-transparent px-1.5 py-1 text-center transition hover:border-gray-200 hover:bg-white/40 dark:hover:border-gray-700 dark:hover:bg-white/5">
      <div className="text-lg font-extrabold tracking-tight sm:text-xl md:text-2xl">{value}</div>
      <div className="mt-1 text-[11px] leading-tight text-gray-600 dark:text-gray-300 sm:text-xs md:text-sm">{label}</div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function MoreButton({ href, children }: { href: string; children: string }) {
  return (
    <div className="mt-5">
      <Link
        href={href}
        className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      >
        {children}
      </Link>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  const userId = session.user.id;

  const [profile, publishedWorksCount, followersCount, followingCount, reviewsCount, commentsCount, reviewFeed, commentFeed] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        profileUrl: true,
        profileUrlsJson: true,
        image: true,
        avatarFocusX: true,
        avatarFocusY: true,
        avatarZoom: true,
        createdAt: true,
        works: {
          where: { status: "PUBLISHED" },
          orderBy: { updatedAt: "desc" },
          take: 24,
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
            genres: { select: { name: true, slug: true } },
            deviantLoveTags: { select: { name: true, slug: true } },
            author: { select: { name: true, username: true, image: true } },
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
            items: {
              orderBy: [{ sortOrder: "asc" }, { addedAt: "desc" }],
              take: 3,
              select: {
                work: {
                  select: {
                    id: true,
                    title: true,
                    coverImage: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.work.count({ where: { authorId: userId, status: "PUBLISHED" } }),
    prisma.followUser.count({ where: { followingId: userId } }),
    prisma.followUser.count({ where: { followerId: userId } }),
    prisma.review.count({ where: { userId } }),
    prisma.comment.count({ where: { userId } }),
    getViewerReviews(userId, { sort: "newest", take: 3 }),
    getViewerComments(userId, { sort: "newest", take: 3 }),
  ]);

  if (!profile) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/profile")}`);
  }

  const chapterLoveRows = profile.works.length
    ? await prisma.chapter.groupBy({
        by: ["workId"],
        where: { workId: { in: profile.works.map((work) => work.id) }, status: "PUBLISHED" },
        _sum: { likeCount: true },
      })
    : [];
  const chapterLoveMap = new Map(chapterLoveRows.map((row) => [row.workId, Number(row._sum.likeCount ?? 0)]));

  const worksWithChapterLove = profile.works.map((work) => ({
    ...work,
    chapterLoveCount: chapterLoveMap.get(work.id) ?? 0,
  }));

  const displayName = profileName(profile);
  const avatar = profile.image || "/images/default-avatar.png";
  const novelWorks = worksWithChapterLove.filter((work) => work.type === "NOVEL");
  const comicWorks = worksWithChapterLove.filter((work) => work.type === "COMIC");
  const avatarFocusX = Number.isFinite(Number(profile.avatarFocusX)) ? Number(profile.avatarFocusX) : 50;
  const avatarFocusY = Number.isFinite(Number(profile.avatarFocusY)) ? Number(profile.avatarFocusY) : 50;
  const avatarZoom = Number.isFinite(Number(profile.avatarZoom)) ? Math.max(1, Number(profile.avatarZoom)) : 1;
  const profileLinks = parseProfileLinks(profile.profileUrlsJson, profile.profileUrl);
  const tAddUrl = await getActiveUILanguageText("Add URL");

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
                {profile.bio ? <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{profile.bio}</p> : null}
                {profileLinks.length ? (
                  <div className="mt-3">
                    <ProfileLinksSheet links={profileLinks} />
                  </div>
                ) : null}
                {profileLinks.length < 5 ? (
                  <Link
                    href="/settings/profile"
                    className="mt-3 inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-300 dark:hover:text-purple-200"
                  >
                    + {tAddUrl}
                  </Link>
                ) : null}
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Joined {formatDate(profile.createdAt)}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 md:flex-col md:items-end md:self-start">
              <Link
                href="/settings/profile"
                className="inline-flex min-w-0 flex-1 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 md:flex-none"
              >
                Edit Profile
              </Link>
              <ProfileShareButton
                path={profile.username ? `/u/${profile.username}` : "/profile"}
                title={`${displayName} · Inkura`}
                iconOnlyOnMobile
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800 md:h-auto md:w-auto md:px-5 md:py-2.5"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
            <ProfileStat label="Works" value={publishedWorksCount} />
            <ProfileStat label="Followers" value={followersCount} href="/profile/followers" />
            <ProfileStat label="Following" value={followingCount} href="/profile/following" />
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#04112b] p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
<h2 className="text-3xl font-extrabold tracking-tight">Published Works</h2>
            </div>
          </div>

          {profile.works.length ? (
            <>
              <PublishedWorksRail title="Novels" works={novelWorks} />
              <PublishedWorksRail title="Comics" works={comicWorks} />
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
              No published works yet.
            </div>
          )}
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[28px] border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#04112b] p-6 shadow-sm self-start">
            <div className="flex items-end justify-between gap-3">
              <div>
<h2 className="text-2xl font-extrabold tracking-tight">Collections</h2>
              </div>
              <ActionLink href="/lists">See all</ActionLink>
            </div>

            {profile.readingLists.length ? (
              <div className="mt-5 grid gap-4">
                {profile.readingLists.map((list) => (
                  <CollectionRailCard
                    key={list.id}
                    href={`/lists/${list.slug}`}
                    title={list.title}
                    description={list.description}
                    itemCount={Number(list._count?.items || 0)}
                    items={Array.isArray(list.items) ? list.items : []}
                    layout="stack"
                  />
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
                No collections yet.
              </div>
            )}
          </section>

          <div className="grid gap-8 self-start">
            <section className="rounded-[28px] border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#04112b] p-6 shadow-sm">
              <div>
<h2 className="text-2xl font-extrabold tracking-tight">Recent Reviews</h2>
              </div>

              {reviewFeed.items.length ? (
                <>
                  <div className="mt-5 grid gap-3">
                    {reviewFeed.items.map((review) => (
                      <ProfileReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                  {reviewsCount > 3 ? <MoreButton href="/profile/reviews">All reviews</MoreButton> : null}
                </>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
                  No reviews yet.
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-[#04112b] p-6 shadow-sm">
              <div>
<h2 className="text-2xl font-extrabold tracking-tight">Recent Comments</h2>
              </div>

              {commentFeed.items.length ? (
                <>
                  <div className="mt-5 grid gap-3">
                    {commentFeed.items.map((comment) => (
                      <ProfileCommentCard key={comment.id} comment={comment} />
                    ))}
                  </div>
                  {commentsCount > 3 ? <MoreButton href="/profile/comments">All comments</MoreButton> : null}
                </>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
                  No comments yet.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
