import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";

// Legacy route: /work/[workId] -> /w/[slug]
export default async function WorkLegacyRedirect({ params }: { params: { workId: string } }) {
  const work = await prisma.work.findUnique({ where: { id: params.workId }, select: { slug: true } });
  if (!work) return notFound();
  redirect(`/w/${work.slug}`);
}
