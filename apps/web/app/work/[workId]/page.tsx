import { notFound, redirect } from "next/navigation";
import { getWorkSlugById } from "@/server/services/works/workSlug";


// Legacy route: /work/[workId] -> /w/[slug]
export default async function WorkLegacyRedirect({ params: paramsPromise }: { params: Promise<{ workId: string }> }) {
  const params = await paramsPromise;
  const work = await getWorkSlugById(params.workId);
  if (!work?.slug) return notFound();
  redirect(`/w/${work.slug}`);
}
