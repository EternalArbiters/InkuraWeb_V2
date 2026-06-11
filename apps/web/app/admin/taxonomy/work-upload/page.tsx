import { listActiveDeviantLoveTags, listActiveGenres, listActiveWarningTags } from "@/server/services/taxonomy/publicTaxonomy";
import prisma from "@/server/db/prisma";
import WorkUploadClient from "./WorkUploadClient";

export const dynamic = "force-dynamic";

export default async function AdminWorkUploadPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await searchParams;

  const [genres, warningTags, deviantLoveTags, initialUser] = await Promise.all([
    listActiveGenres({ take: 200 }),
    listActiveWarningTags({ take: 100 }),
    listActiveDeviantLoveTags({ take: 200 }),
    userId
      ? prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true, name: true, image: true },
        })
      : Promise.resolve(null),
  ]);

  return (
    <WorkUploadClient
      genres={genres as any}
      warningTags={warningTags as any}
      deviantLoveTags={deviantLoveTags as any}
      initialUser={initialUser ?? null}
    />
  );
}
