import Link from "next/link";
import { redirect } from "next/navigation";
import { apiJson } from "@/lib/serverApi";

export const dynamic = "force-dynamic";

function clamp(n: unknown, def: number, min: number, max: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return def;
  return Math.max(min, Math.min(max, v));
}

export default async function StudioWorkPage({
  params: paramsPromise,
}: {
  params: Promise<{ workId: string }>;
}) {
  const params = await paramsPromise;
  const workId = params.workId;

  const res = await apiJson<{ work: any }>(`/api/studio/works/${workId}`);
  if (!res.ok) {
    redirect("/studio");
  }

  const work = res.data.work;
  const publishType = String(work.publishType || "ORIGINAL").toUpperCase();
  const isComic = work.type === "COMIC";

  return (
    <main className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="text-3xl font-extrabold tracking-tight">{work.title}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">{work.type}</span>
              <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">{publishType}</span>
              <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">{work.status}</span>
              <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">slug: {work.slug}</span>
            </div>

            {publishType !== "ORIGINAL" ? (
              <div className="mt-3 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                {work.originalAuthorCredit ? (
                  <div>
                    Original author: <b>{work.originalAuthorCredit}</b>
                  </div>
                ) : null}
                {publishType === "REUPLOAD" && work.originalTranslatorCredit ? (
                  <div>
                    Original translator: <b>{work.originalTranslatorCredit}</b>
                  </div>
                ) : null}
                {work.translatorCredit ? (
                  <div>
                    Translator credit: <b>{work.translatorCredit}</b>
                  </div>
                ) : null}
                {work.companyCredit ? (
                  <div>
                    Company: <b>{work.companyCredit}</b>
                  </div>
                ) : null}
                {work.sourceUrl ? (
                  <div>
                    Source:{" "}
                    <a
                      className="text-purple-600 dark:text-purple-400 hover:underline break-all"
                      href={work.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {work.sourceUrl}
                    </a>
                  </div>
                ) : null}
                {publishType === "REUPLOAD" && work.uploaderNote ? (
                  <div className="italic">{work.uploaderNote}</div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">            <Link
              href={`/studio/works/${work.id}/edit`}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold text-center"
            >
              Edit Info
            </Link>
            <Link
              href={`/studio/works/${work.id}/chapters/new`}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 font-semibold text-center"
            >
              New chapter
            </Link>
            <Link
              href={`/w/${work.slug}`}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 font-semibold text-center"
            >
              View public page
            </Link>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-800">
            <div className="text-sm font-semibold">Chapters</div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {(work.chapters || []).length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-600 dark:text-gray-300">No chapters yet.</div>
            ) : (
              (work.chapters || []).map((ch: any) => {
                const thumb = ch.thumbnailImage || null;
                const focusX = clamp(ch.thumbnailFocusX, 50, 0, 100);
                const focusY = clamp(ch.thumbnailFocusY, 50, 0, 100);
                const zoom = clamp(ch.thumbnailZoom, 1, 1, 2.5);

                return (
                  <div key={ch.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-[120px] shrink-0">
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-black/5 dark:bg-white/5">
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt={ch.title}
                              className="absolute inset-0 w-full h-full object-cover"
                              style={{
                                objectPosition: `${focusX}% ${focusY}%`,
                                transform: `scale(${zoom})`,
                                transformOrigin: "center",
                              }}
                              loading="lazy"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">Auto</div>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          #{ch.number} — {ch.title}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                          {ch.status === "PUBLISHED" ? "Published" : "Draft"}
                          {ch.isMature ? " • Mature" : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Link
                        href={`/studio/works/${work.id}/chapters/${ch.id}/edit`}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold"
                      >
                        Edit
                      </Link>
                      {isComic ? (
                        <Link
                          href={`/studio/works/${work.id}/chapters/${ch.id}/pages`}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold"
                        >
                          Pages
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
