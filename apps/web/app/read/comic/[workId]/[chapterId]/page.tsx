import { notFound, redirect } from "next/navigation";
import { getWorkSlugById } from "@/server/services/works/workSlug";


// Legacy route: /read/comic/[workId]/[chapterId] -> /w/[slug]/read/[chapterId]
export default async function LegacyComicRedirect({
  params: paramsPromise,
}: {
  params: Promise<{ workId: string; chapterId: string }>;
}) {
  const params = await paramsPromise;
  const work = await getWorkSlugById(params.workId);
  if (!work?.slug) return notFound();
  redirect(`/w/${work.slug}/read/${params.chapterId}`);
}
