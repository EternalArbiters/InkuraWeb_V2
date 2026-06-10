import "server-only";

import {
  PUBLIC_CONTENT_REVALIDATE,
  publicHomeTag,
  publicWorksTag,
  withCachedPublicData,
} from "@/server/cache/publicContent";
import prisma from "@/server/db/prisma";

export type BannerWork = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  bannerImage: string | null;
  type: string;
  author: { username: string | null };
};

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export async function getBannerWorks(): Promise<BannerWork[]> {
  const pool = await withCachedPublicData(
    ["public-banner-pool:v1"],
    [publicHomeTag(), publicWorksTag()],
    PUBLIC_CONTENT_REVALIDATE.home,
    () =>
      prisma.work.findMany({
        where: {
          status: "PUBLISHED",
          isMature: false,
          deviantLoveTags: { none: {} },
        },
        orderBy: [{ likeCount: "desc" }, { ratingAvg: "desc" }],
        take: 20,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          coverImage: true,
          bannerImage: true,
          type: true,
          author: { select: { username: true } },
        },
      })
  );

  return shuffle(pool).slice(0, 5);
}
