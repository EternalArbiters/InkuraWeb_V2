import BackButton from "@/app/components/BackButton";
import { redirect } from "next/navigation";
import { apiJson } from "@/lib/serverApi";
import WorkEditForm from "./WorkEditForm";

export const dynamic = "force-dynamic";

export default async function WorkEditPage({
  params: paramsPromise,
}: {
  params: Promise<{ workId: string }>;
}) {
  const params = await paramsPromise;
  const workId = params.workId;

  const [workRes, genresRes, warningsRes, deviantRes] = await Promise.all([
    apiJson<{ work: any }>(`/api/studio/works/${workId}`),
    apiJson<{ genres: any[] }>("/api/genres?take=200"),
    apiJson<{ warningTags: any[] }>("/api/warnings?take=100"),
    apiJson<{ deviantLoveTags: any[] }>("/api/deviant-love?take=200"),
  ]);

  if (!workRes.ok) {
    if (workRes.status === 401) {
      redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/studio/works/${workId}/edit`)}`);
    }
    redirect(`/studio/works/${workId}`);
  }

  const work = workRes.data.work;
  const genres = genresRes.ok ? genresRes.data.genres : [];
  const warningTags = warningsRes.ok ? warningsRes.data.warningTags : [];
  const deviantLoveTags = deviantRes.ok ? deviantRes.data.deviantLoveTags : [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Edit work</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Update metadata, tags, and credits.</p>
          </div>
          <BackButton href={`/studio/works/${workId}`} />
        </div>

        <WorkEditForm work={work as any} genres={genres as any} warningTags={warningTags as any} deviantLoveTags={deviantLoveTags as any} />
      </div>
    </main>
  );
}
