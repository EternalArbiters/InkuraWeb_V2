import Link from "next/link";
import { notFound } from "next/navigation";
import ContentWarningsGate from "@/components/ContentWarningsGate";
import { apiJson } from "@/server/http/apiJson";
import WorkCoverBadges from "../../components/WorkCoverBadges";
import LockLabel from "@/app/components/LockLabel";
import CommentSection from "@/app/components/work/CommentSection";
import LikeButton from "@/app/components/work/LikeButton";
import BookmarkButton from "@/app/components/work/BookmarkButton";
import RatingStars from "@/app/components/work/RatingStars";
import ShareButton from "@/app/components/work/ShareButton";
import AddToListButton from "@/app/components/work/AddToListButton";
import ReviewSection from "@/app/components/work/ReviewSection";
import WorkInfoPanel from "@/app/components/work/WorkInfoPanel";
import WorkChaptersWebtoon from "@/app/components/work/WorkChaptersWebtoon";
import SeriesArcsPanel from "@/app/components/work/SeriesArcsPanel";

export const dynamic = "force-dynamic";

type ArcPreview = {
  href: string;
  title: string;
  coverImage?: string | null;
};

function labelFromHref(href: string) {
  const clean = String(href || "").trim();
  if (!clean) return "Untitled Arc";

  try {
    const u = new URL(clean, "https://inkura.local");
    const segment = u.pathname.split("/").filter(Boolean).pop() || clean;
    return decodeURIComponent(segment).replace(/[-_]+/g, " ").trim() || "Untitled Arc";
  } catch {
    return clean.replace(/[-_]+/g, " ").trim() || "Untitled Arc";
  }
}

function extractArcSlug(href: string) {
  const clean = String(href || "").trim();
  if (!clean) return null;

  try {
    const u = new URL(clean, "https://inkura.local");
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] !== "w" || !parts[1]) return null;
    return decodeURIComponent(parts[1]);
  } catch {
    return null;
  }
}

async function fetchArcPreview(href: string | null | undefined): Promise<ArcPreview | null> {
  const raw = String(href || "").trim();
  if (!raw) return null;

  const slug = extractArcSlug(raw);
  if (slug) {
    const res = await apiJson<{ work: any; gated?: boolean }>(`/api/works/slug/${encodeURIComponent(slug)}`);
    if (res.ok && !(res.data as any)?.gated && (res.data as any)?.work) {
      const arc = (res.data as any).work;
      return {
        href: `/w/${arc.slug}`,
        title: String(arc.title || labelFromHref(raw)),
        coverImage: arc.coverImage || null,
      };
    }
  }

  return {
    href: raw,
    title: labelFromHref(raw),
    coverImage: null,
  };
}

export default async function WorkPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;

  const res = await apiJson<{ work: any; gated: boolean; viewer: any; interactions?: any }>(`/api/works/slug/${params.slug}`);
  if (!res.ok) return notFound();

  const work = res.data.work;
  const gated = !!res.data.gated;
  const viewer = res.data.viewer;
  const interactions = (res.data as any).interactions || { liked: false, bookmarked: false, myRating: null };
  const progress = (res.data as any).progress || { lastReadChapterNumber: null };
  const canViewMature = !!viewer?.canViewMature;
  const canViewDeviantLove = !!viewer?.canViewDeviantLove;
  const gateReason = (res.data as any).gateReason as string | undefined;

  if (gated) {
    const isDeviant = gateReason === "DEVIANT_LOVE" || gateReason === "BOTH";
    return (
      <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 overflow-hidden">
            <div className="p-6">
              <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-black/70 text-white">
                {isDeviant ? <LockLabel text="Deviant Love" /> : "18+ Mature Content"}
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight">{work.title}</h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {isDeviant
                  ? "Karya ini ditandai Deviant Love. Untuk membaca, kamu perlu unlock 18+ dan unlock Deviant Love di Settings."
                  : "Karya ini ditandai 18+. Untuk membaca, kamu perlu unlock + opt-in di Settings."}
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Link href="/settings/account" className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110">
                  {isDeviant ? "Buka Settings (unlock 18+ + Deviant Love)" : "Buka Settings (unlock + opt-in 18+)"}
                </Link>
              </div>

              {work.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={work.coverImage}
                  alt={work.title}
                  className="mt-6 w-full max-w-sm border border-gray-200 dark:border-gray-800 blur-md"
                />
              ) : null}

              {viewer && (isDeviant ? !canViewDeviantLove : !canViewMature) ? (
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                  {isDeviant
                    ? "Deviant Love locked. Pastikan kamu sudah centang 18+ lalu unlock Deviant Love."
                    : 'NSFW locked. Pastikan kamu sudah centang "I am 18+" dan aktifkan "Include mature content".'}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    );
  }

  const [prevArc, nextArc] = await Promise.all([
    fetchArcPreview(work.prevArcUrl),
    fetchArcPreview(work.nextArcUrl),
  ]);

  const seriesItems = [
    prevArc ? { ...prevArc } : null,
    { href: `/w/${work.slug}`, title: String(work.title || "Untitled"), coverImage: work.coverImage || null, active: true },
    nextArc ? { ...nextArc } : null,
  ].filter(Boolean) as Array<{ href: string; title: string; coverImage?: string | null; active?: boolean }>;

  const combinedWarnings = Array.isArray(work.warningTags) ? work.warningTags : [];
  const authorName = work.author?.name || work.author?.username || "Unknown";

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          <div>
            <div className="border border-gray-200 dark:border-gray-800 overflow-hidden bg-white/70 dark:bg-gray-900/50">
              <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800">
                {work.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={work.coverImage} alt={work.title} className="w-full h-full object-cover" />
                ) : null}

                <WorkCoverBadges
                  work={{
                    type: work.type,
                    publishType: work.publishType,
                    isMature: !!work.isMature,
                    language: work.language,
                    comicType: work.comicType,
                    updatedAt: work.updatedAt,
                  }}
                />
              </div>
              <div className="p-4">
                <div className="text-sm text-gray-600 dark:text-gray-300 truncate">Up by <b>{authorName}</b></div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">{work.type}</span>
                  <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">{work.completion}</span>
                  {work.language ? (
                    <span className="px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800">{String(work.language).toUpperCase()}</span>
                  ) : null}
                  {work.isMature ? <span className="px-2 py-1 rounded-full bg-black/70 text-white">18+</span> : null}
                </div>

                {combinedWarnings.length ? (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-amber-800 dark:text-amber-200">NSFW</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {combinedWarnings.map((t: any) => (
                        <span
                          key={t.slug}
                          className="text-[11px] px-2 py-1 rounded-full border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {Array.isArray(work.genres) && work.genres.length ? (
                  <div className="mt-4">
                    <div className="text-xs font-semibold">Genres</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {work.genres.slice(0, 18).map((g: any) => (
                        <Link
                          key={g.slug}
                          href={`/search?genre=${g.slug}`}
                          className="text-[11px] px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          {g.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                {Array.isArray(work.tags) && work.tags.length ? (
                  <div className="mt-4">
                    <div className="text-xs font-semibold">Tags</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {work.tags.slice(0, 24).map((t: any) => (
                        <Link
                          key={t.slug}
                          href={`/search?tag=${encodeURIComponent(t.name)}`}
                          className="text-[11px] px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                        >
                          #{t.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{work.title}</h1>

            <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 md:flex-wrap md:overflow-visible">
              <LikeButton workId={work.id} initialLiked={!!interactions.liked} initialCount={Number(work.likeCount ?? 0)} />
              <BookmarkButton workId={work.id} initialBookmarked={!!interactions.bookmarked} />
              <AddToListButton workId={work.id} />
              <ShareButton title={work.title} />
              <RatingStars
                workId={work.id}
                initialMyRating={typeof interactions.myRating === "number" ? interactions.myRating : null}
                ratingAvg={Number(work.ratingAvg ?? 0)}
                ratingCount={Number(work.ratingCount ?? 0)}
              />
            </div>

            {work.description ? <p className="mt-3 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{work.description}</p> : null}

            <div className="mt-6">
              <WorkInfoPanel work={work} />
            </div>

            <div className="mt-6">
              <ContentWarningsGate storageKey={`work:${work.id}`} title={work.title} warnings={combinedWarnings}>
                <div className="grid gap-3">
                  {(prevArc || nextArc) ? (
                    <SeriesArcsPanel
                      items={seriesItems}
                      prevArc={prevArc ? { ...prevArc, label: "Previous Arc" } : null}
                      nextArc={nextArc ? { ...nextArc, label: "Next Arc" } : null}
                    />
                  ) : null}

                  <WorkChaptersWebtoon
                    slug={work.slug}
                    chapters={Array.isArray(work.chapters) ? work.chapters : []}
                    lastReadChapterNumber={typeof progress?.lastReadChapterNumber === "number" ? progress.lastReadChapterNumber : null}
                  />
                </div>
              </ContentWarningsGate>
            </div>

            <ReviewSection
              workId={work.id}
              ratingAvg={Number(work.ratingAvg ?? 0)}
              ratingCount={Number(work.ratingCount ?? 0)}
              initialMyRating={typeof interactions.myRating === "number" ? interactions.myRating : null}
            />

            {/* Comments: aggregated from all chapters */}
            <CommentSection targetType="CHAPTER" targetId={work.id} title="Comments" scope="workChapters" showComposer={false} sort="top" />
          </div>
        </div>
      </div>
    </main>
  );
}
