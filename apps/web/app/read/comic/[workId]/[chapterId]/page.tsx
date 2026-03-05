import { notFound, redirect } from "next/navigation";
import { apiJson } from "@/server/http/apiJson";

export const dynamic = "force-dynamic";

// Legacy route: /read/comic/[workId]/[chapterId] -> /w/[slug]/read/[chapterId]
export default async function LegacyComicRedirect({
  params: paramsPromise,
}: {
  params: Promise<{ workId: string; chapterId: string }>;
}) {
  const params = await paramsPromise;
  const res = await apiJson<{ work: { slug: string } }>(`/api/works/${params.workId}`);
  if (!res.ok || !res.data.work?.slug) return notFound();
  redirect(`/w/${res.data.work.slug}/read/${params.chapterId}`);
}
