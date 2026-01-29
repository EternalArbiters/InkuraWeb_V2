import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";

// Legacy route: /read/comic/[workId]/[chapterId] -> /w/[slug]/read/[chapterId]
export default async function LegacyComicRedirect({ params }: { params: { workId: string; chapterId: string } }) {
  const work = await prisma.work.findUnique({ where: { id: params.workId }, select: { slug: true } });
  if (!work) return notFound();
  redirect(`/w/${work.slug}/read/${params.chapterId}`);
}
