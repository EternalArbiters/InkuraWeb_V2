import "server-only";

import prisma from "@/server/db/prisma";
import { deviantLoveTagSlugs } from "@/lib/deviantLoveCatalog";
import {
  PUBLIC_CONTENT_REVALIDATE,
  publicProfileTag,
  publicProfilesTag,
  publicReadingListsTag,
  publicWorksTag,
  withCachedPublicData,
} from "@/server/cache/publicContent";
import { getViewerBasic } from "@/server/services/works/viewer";
import { profileHotspot } from "@/server/observability/profiling";

type Viewer = Awaited<ReturnType<typeof getViewerBasic>>;

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
  const hasLegacyDeviantGenre = Array.isArray(work.genres) && work.genres.some((genre) => legacyDeviant.has(String(genre.slug || "")));
  const hasDeviantTags = Array.isArray(work.deviantLoveTags) && work.deviantLoveTags.length > 0;
  const requiresDeviantGate = (hasLegacyDeviantGenre || hasDeviantTags) && !canViewDeviantLove;

  return !(requiresMatureGate || requiresDeviantGate);
}

async function loadPublicProfilePageData(username: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      profileUrl: true,
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
          author: { select: { username: true, name: true, image: true } },
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

  if (!user) {
    return null;
  }

  const [publishedWorksCount, followersCount, followingCount] = await Promise.all([
    prisma.work.count({ where: { authorId: user.id, status: "PUBLISHED" } }),
    prisma.followUser.count({ where: { followingId: user.id } }),
    prisma.followUser.count({ where: { followerId: user.id } }),
  ]);

  return {
    ...user,
    stats: {
      publishedWorksCount,
      followersCount,
      followingCount,
    },
  };
}

export async function getPublicProfilePageData(username: string) {
  return withCachedPublicData(
    ["public-profile-page:v2", username],
    [publicProfilesTag(), publicProfileTag(username), publicWorksTag(), publicReadingListsTag()],
    PUBLIC_CONTENT_REVALIDATE.profile,
    async () => profileHotspot("profile.public", { username }, () => loadPublicProfilePageData(username))
  );
}

export async function getViewerProfilePagePayload() {
  const viewer = await profileHotspot("profile.viewerPayload", {}, () => getViewerBasic());
  return { viewer };
}


export async function getPublicCollectionsPageData(username: string) {
  const [{ viewer }, publicData] = await Promise.all([
    getViewerProfilePagePayload(),
    withCachedPublicData(
      ["public-profile-collections:v1", username],
      [publicProfilesTag(), publicProfileTag(username), publicReadingListsTag()],
      PUBLIC_CONTENT_REVALIDATE.profile,
      async () =>
        profileHotspot("profile.publicCollections", { username }, () =>
          prisma.user.findUnique({
            where: { username },
            select: {
              id: true,
              username: true,
              name: true,
              readingLists: {
                where: { isPublic: true },
                orderBy: [{ updatedAt: "desc" }],
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
                    take: 12,
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
            },
          })
        )
    ),
  ]);

  if (!publicData) {
    return null;
  }

  const visibleLists = (publicData.readingLists || []).map((list) => ({
    ...list,
    itemCount: list._count.items,
    items: (list.items || []).filter((item) => item.work && canViewWork(item.work, viewer)),
  }));

  return {
    user: publicData,
    viewer,
    visibleLists,
  };
}

export async function getProfilePageData(username: string) {
  const [publicData, viewerPayload] = await Promise.all([
    getPublicProfilePageData(username),
    getViewerProfilePagePayload(),
  ]);

  if (!publicData) {
    return null;
  }

  const visibleWorks = (publicData.works || []).filter((work) => canViewWork(work, viewerPayload.viewer));
  const visibleLists = (publicData.readingLists || []).map((list) => ({
    ...list,
    itemCount: list._count.items,
    items: (list.items || []).filter((item) => item.work && canViewWork(item.work, viewerPayload.viewer)),
  }));
  const visibleReviews = (publicData.reviews || []).filter(
    (review) => review.work && canViewWork(review.work, viewerPayload.viewer)
  );

  return {
    user: publicData,
    viewer: viewerPayload.viewer,
    visibleWorks,
    visibleLists,
    visibleReviews,
  };
}
