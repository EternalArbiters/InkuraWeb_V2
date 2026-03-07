import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { deviantLoveTagSlugs } from "@/lib/deviantLoveCatalog";
import WorksGrid from "@/app/components/WorksGrid";
import PublicUserLink from "@/app/components/user/PublicUserLink";

export const dynamic = "force-dynamic";

type Viewer = {
  id: string;
  role: "ADMIN" | "USER";
  adultConfirmed: boolean;
  deviantLoveConfirmed: boolean;
} | null;

async function getViewer(): Promise<Viewer> {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, adultConfirmed: true, deviantLoveConfirmed: true },
  });
  return user;
}

const legacyDeviant = new Set<string>([...deviantLoveTagSlugs(), "lgbtq", "bara-ml", "alpha-beta-omega"]);

function canViewWork(
  work: {
    authorId?: string | null;
    isMature?: boolean | null;
    genres?: { slug?: string | null }[];
    deviantLoveTags?: { slug?: string | null }[];
  },
  viewer: Viewer
) {
  const isOwner = !!viewer?.id && viewer.id === work.authorId;
  const canViewMature = isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed);
  const canViewDeviantLove = isOwner || viewer?.role === "ADMIN" || (!!viewer && viewer.adultConfirmed && viewer.deviantLoveConfirmed);

  const requiresMatureGate = !!work.isMature && !canViewMature;
  const hasLegacyDeviantGenre = Array.isArray(work.genres) && work.genres.some((g) => legacyDeviant.has(String(g.slug || "")));
  const hasDeviantTags = Array.isArray(work.deviantLoveTags) && work.deviantLoveTags.length > 0;
  const requiresDeviantGate = (hasLegacyDeviantGenre || hasDeviantTags) && !canViewDeviantLove;

  return !(requiresMatureGate || requiresDeviantGate);
}

function joinedLabel(input: Date | string) {
  const d = input instanceof Date ? input : new Date(input);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long" });
}

function avatarInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]?.toUpperCase() : "U";
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
      <div className="text-2xl font-extrabold tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{label}</div>
    </div>
  );
}

function ListCard({ list }: { list: any }) {
  const previews = Array.isArray(list.items) ? list.items.map((it: any) => it.work).filter(Boolean).slice(0, 3) : [];
  return (
    <Link
      href={`/lists/${list.slug}`}
      className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4 hover:shadow-lg transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-extrabold truncate">{list.title}</div>
          {list.description ? <div className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{list.description}</div> : null}
        </div>
        <span className="shrink-0 text-[11px] px-2 py-1 rounded-full bg-emerald-600 text-white">PUBLIC</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
        <span>{list.itemCount} item</span>
        <span>Updated {new Date(list.updatedAt).toLocaleDateString()}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {previews.length ? (
          previews.map((work: any) => (
            <div key={work.id} className="aspect-[3/4] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {work.coverImage ? <img src={work.coverImage} alt={work.title} className="h-full w-full object-cover" /> : null}
            </div>
          ))
        ) : (
          <div className="col-span-3 text-sm text-gray-600 dark:text-gray-300">No visible works in this list yet.</div>
        )}
      </div>
    </Link>
  );
}

function ReviewStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} aria-hidden="true">{i < value ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: any }) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/w/${review.work.slug}`} className="font-semibold hover:text-purple-400">
              {review.work.title}
            </Link>
            <ReviewStars value={review.rating} />
            {review.isSpoiler ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-200">
                Spoiler
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
            {new Date(review.createdAt).toLocaleString()} · Helpful {review.helpfulCount}
          </div>
        </div>
        <Link
          href={`/w/${review.work.slug}`}
          className="shrink-0 rounded-full border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Open
        </Link>
      </div>

      {review.title ? <div className="mt-3 text-sm font-semibold">{review.title}</div> : null}
      <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap line-clamp-5">{review.body}</div>
    </div>
  );
}

export default async function PublicProfilePage({ params: paramsPromise }: { params: Promise<{ username: string }> }) {
  const params = await paramsPromise;
  const viewer = await getViewer();

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      createdAt: true,
      works: {
        where: { status: "PUBLISHED" },
        orderBy: [{ updatedAt: "desc" }],
        take: 12,
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
          authorId: true,
          author: { select: { username: true, name: true } },
          genres: { select: { slug: true } },
          deviantLoveTags: { select: { slug: true } },
        },
      },
      readingLists: {
        where: { isPublic: true },
        orderBy: [{ updatedAt: "desc" }],
        take: 6,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          isPublic: true,
          updatedAt: true,
          _count: { select: { items: true } },
          items: {
            orderBy: [{ sortOrder: "asc" }, { addedAt: "desc" }],
            take: 6,
            select: {
              work: {
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  coverImage: true,
                  authorId: true,
                  isMature: true,
                  genres: { select: { slug: true } },
                  deviantLoveTags: { select: { slug: true } },
                },
              },
            },
          },
        },
      },
      reviews: {
        orderBy: [{ updatedAt: "desc" }],
        take: 10,
        where: { work: { status: "PUBLISHED" } },
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          isSpoiler: true,
          helpfulCount: true,
          createdAt: true,
          work: {
            select: {
              id: true,
              slug: true,
              title: true,
              authorId: true,
              isMature: true,
              genres: { select: { slug: true } },
              deviantLoveTags: { select: { slug: true } },
            },
          },
        },
      },
    },
  });

  if (!user) return notFound();

  const visibleWorks = (user.works || []).filter((work) => canViewWork(work, viewer));
  const visibleLists = (user.readingLists || []).map((list) => ({
    ...list,
    itemCount: list._count.items,
    items: (list.items || []).filter((item) => item.work && canViewWork(item.work, viewer)),
  }));
  const visibleReviews = (user.reviews || []).filter((review) => review.work && canViewWork(review.work, viewer));

  const displayName = (user.name && user.name.trim()) || (user.username && user.username.trim()) || "Unknown";

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 min-w-0">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={displayName} className="h-20 w-20 rounded-full object-cover border border-gray-200 dark:border-gray-800" />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-3xl font-extrabold text-gray-700 dark:text-gray-200">
                  {avatarInitial(displayName)}
                </div>
              )}

              <div className="min-w-0">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight truncate">{displayName}</h1>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">@{user.username}</div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Joined {joinedLabel(user.createdAt)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full md:w-auto md:min-w-[340px]">
              <StatCard label="Published Works" value={visibleWorks.length} />
              <StatCard label="Public Lists" value={visibleLists.length} />
              <StatCard label="Reviews" value={visibleReviews.length} />
            </div>
          </div>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Published Works</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Works published by <PublicUserLink user={user} className="hover:text-purple-400" />.</p>
            </div>
          </div>
          <div className="mt-4">
            <WorksGrid works={visibleWorks as any[]} />
          </div>
        </section>

        <section className="mt-8">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Public Reading Lists</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Shared collections that other readers can open.</p>
          </div>

          {visibleLists.length ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {visibleLists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 text-sm text-gray-600 dark:text-gray-300">
              No public lists yet.
            </div>
          )}
        </section>

        <section className="mt-8">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Recent Reviews</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Latest ratings and review notes from this user.</p>
          </div>

          {visibleReviews.length ? (
            <div className="mt-4 grid gap-4">
              {visibleReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 text-sm text-gray-600 dark:text-gray-300">
              No public reviews yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
