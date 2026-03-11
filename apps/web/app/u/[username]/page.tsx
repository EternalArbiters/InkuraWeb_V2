import Link from "next/link";
import { notFound } from "next/navigation";
import WorksGrid from "@/app/components/WorksGrid";
import ActionLink from "@/app/components/ActionLink";
import CollectionRailCard from "@/app/components/user/CollectionRailCard";
import FollowToggleButton from "@/app/components/user/FollowToggleButton";
import PublicProfileActionsMenu from "@/app/components/user/PublicProfileActionsMenu";
import PublicUserLink from "@/app/components/user/PublicUserLink";
import HorizontalRail from "@/app/home/HorizontalRail";
import { displayUrlLabel, parseProfileUrls } from "@/lib/profileUrls";
import { logPageRenderMetric } from "@/server/observability/metrics";
import { getProfilePageData } from "@/server/services/profile/publicProfilePage";

export const dynamic = "force-dynamic";

function joinedLabel(input: Date | string) {
  const date = input instanceof Date ? input : new Date(input);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "long" });
}

function avatarInitial(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed[0]?.toUpperCase() : "U";
}

function StatCard({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const content = (
    <div className="min-w-0 rounded-2xl border border-transparent px-1.5 py-1 text-center transition hover:border-gray-200 hover:bg-white/40 dark:hover:border-gray-700 dark:hover:bg-white/5">
      <div className="text-lg font-extrabold tracking-tight sm:text-xl md:text-2xl">{value}</div>
      <div className="mt-1 text-[11px] leading-tight text-gray-600 dark:text-gray-300 sm:text-xs md:text-sm">{label}</div>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function ReviewStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1 text-amber-400">
      {Array.from({ length: 5 }).map((_, index) => (
        <span key={index} aria-hidden="true">
          {index < value ? "★" : "☆"}
        </span>
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
  const startedAt = Date.now();
  let username = "";

  try {
    const params = await paramsPromise;
    username = params.username;
    const data = await getProfilePageData(params.username);

    if (!data) {
      return notFound();
    }

    const { user, viewer, viewerFollowingUser, viewerBlockedUser, visibleWorks, visibleLists, visibleReviews } = data;
    const displayName = (user.name && user.name.trim()) || (user.username && user.username.trim()) || "Unknown";
    const isSelf = viewer?.id === user.id;
    const profileUrls = parseProfileUrls(user.profileUrlsJson, user.profileUrl);
    const callbackPath = `/u/${user.username}`;

    return (
      <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
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
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight break-words">{displayName}</h1>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">@{user.username}</div>
                  {user.bio ? <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{user.bio}</p> : null}
                  {profileUrls.length ? (
                    <div className="mt-3 flex flex-col gap-1.5">
                      {profileUrls.map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-sm font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-300 dark:hover:text-purple-200 break-all"
                        >
                          {displayUrlLabel(url)}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">Joined {joinedLabel(user.createdAt)}</div>
                </div>
              </div>

              {!isSelf ? (
                <div className="md:self-start">
                  <PublicProfileActionsMenu
                    userId={user.id}
                    username={user.username}
                    displayName={displayName}
                    initialBlocked={viewerBlockedUser}
                    requiresAuth={!viewer}
                  />
                </div>
              ) : null}
            </div>

            {!isSelf ? (
              <div className="mt-5">
                {viewerBlockedUser ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-full items-center justify-center rounded-full border border-red-300 px-5 py-3 text-sm font-semibold text-red-600 opacity-80 dark:border-red-900 dark:text-red-300"
                  >
                    Blocked
                  </button>
                ) : viewer ? (
                  <div className="w-full">
                    <FollowToggleButton userId={user.id} initialFollowing={viewerFollowingUser} fullWidth />
                  </div>
                ) : (
                  <Link
                    href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`}
                    className="inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110"
                  >
                    Follow
                  </Link>
                )}
              </div>
            ) : null}

            <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-4">
              <StatCard label="Works" value={user.stats?.publishedWorksCount || 0} />
              <StatCard label="Followers" value={user.stats?.followersCount || 0} href={`/u/${user.username}/followers`} />
              <StatCard label="Following" value={user.stats?.followingCount || 0} href={`/u/${user.username}/following`} />
            </div>
          </div>

          <section className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Published Works</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Works published by <PublicUserLink user={user} className="hover:text-purple-400" />.
                </p>
              </div>
            </div>
            <div className="mt-4">
              <WorksGrid works={visibleWorks as any[]} />
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Collections</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Collections shared on this profile for other readers to explore.</p>
              </div>
              <ActionLink href={`/u/${user.username}/collections`}>See all</ActionLink>
            </div>

            {visibleLists.length ? (
              <div className="mt-4">
                <HorizontalRail>
                  {visibleLists.map((list) => (
                    <CollectionRailCard
                      key={list.id}
                      href={`/lists/${list.slug}`}
                      title={list.title}
                      description={list.description}
                      itemCount={Number(list.itemCount || list._count?.items || 0)}
                      items={Array.isArray(list.items) ? list.items : []}
                    />
                  ))}
                </HorizontalRail>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 text-sm text-gray-600 dark:text-gray-300">
                No collections yet.
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
  } finally {
    logPageRenderMetric("profile.public", startedAt, { username });
  }
}
