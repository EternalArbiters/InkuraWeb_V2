import { notFound, redirect } from "next/navigation";
import { apiJson } from "@/server/http/apiJson";

export const dynamic = "force-dynamic";

// Legacy route: /work/[workId] -> /w/[slug]
export default async function WorkLegacyRedirect({ params: paramsPromise }: { params: Promise<{ workId: string }> }) {
  const params = await paramsPromise;
  const res = await apiJson<{ work: { id: string; slug: string } }>(`/api/works/${params.workId}`);
  if (!res.ok || !res.data.work?.slug) return notFound();
  redirect(`/w/${res.data.work.slug}`);
}
