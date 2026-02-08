import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Legacy route: /read/comic/[workId]/[chapterId] -> /w/[slug]/read/[chapterId]
export default async function LegacyComicRedirect({ params: paramsPromise }: { params: Promise<{ workId: string; chapterId: string }> }) {
  const params = await paramsPromise;
  const work = await prisma.work.findUnique({ where: { id: params.workId }, select: { slug: true } });
  if (!work) return notFound();
  redirect(`/w/${work.slug}/read/${params.chapterId}`);
}
