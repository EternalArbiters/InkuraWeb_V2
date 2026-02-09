import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Legacy route: /work/[workId] -> /w/[slug]
export default async function WorkLegacyRedirect({ params: paramsPromise }: { params: Promise<{ workId: string }> }) {
  const params = await paramsPromise;
  const work = await prisma.work.findUnique({ where: { id: params.workId }, select: { slug: true } });
  if (!work) return notFound();
  redirect(`/w/${work.slug}`);
}
