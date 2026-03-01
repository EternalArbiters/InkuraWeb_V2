import OriginFlag from "./OriginFlag";

/**
 * WorkCoverBadges
 * Reusable cover overlay badges used across Home cards, grids, search results, and work pages.
 * Required labels (per spec):
 * - origin flag (small in corner)
 * - NOVEL/COMIC
 * - ORIGINAL/TRANSLATION/REUPLOAD
 * - 18+ only if mature
 */

export type WorkBadgeInput = {
  type?: string | null;
  publishType?: string | null;
  isMature?: boolean | null;
  language?: string | null;
  comicType?: string | null;
  updatedAt?: string | Date | null;
};

function normalize(v?: string | null) {
  return String(v || "").trim().toUpperCase();
}

function publishTypeLabel(publishType?: string | null) {
  const p = normalize(publishType);
  if (p === "ORIGINAL") return "Original";
  if (p === "TRANSLATION") return "Translation";
  if (p === "REUPLOAD") return "Reupload";
  return null;
}

function typeBadgeClass(type?: string | null) {
  const t = normalize(type);
  if (t === "NOVEL") return "bg-blue-600/90 text-white";
  if (t === "COMIC") return "bg-pink-600/90 text-white";
  return "bg-gray-700/80 text-white";
}

function originFlagEmoji(input: WorkBadgeInput) {
  const type = normalize(input.type);
  const comicType = normalize(input.comicType);
  const lang = String(input.language || "")
    .trim()
    .toLowerCase()
    .split("-")[0];

  // Comics: prefer comicType (MANGA/MANHWA/MANHUA)
  if (type === "COMIC") {
    if (comicType === "MANGA") return "🇯🇵";
    if (comicType === "MANHWA") return "🇰🇷";
    if (comicType === "MANHUA") return "🇨🇳";
    if (comicType === "WESTERN") return "🌍";
    if (comicType === "OTHER") return "🏳️";
  }

  // Novels (and fallback): map language to flag
  const map: Record<string, string> = {
    ja: "🇯🇵",
    jp: "🇯🇵",
    ko: "🇰🇷",
    kr: "🇰🇷",
    zh: "🇨🇳",
    cn: "🇨🇳",
    id: "🇮🇩",
    en: "🇺🇸",
    fr: "🇫🇷",
    de: "🇩🇪",
    es: "🇪🇸",
    it: "🇮🇹",
    ru: "🇷🇺",
    pt: "🇵🇹",
    tr: "🇹🇷",
    vi: "🇻🇳",
    th: "🇹🇭",
    hi: "🇮🇳",
    ar: "🇸🇦",
    ms: "🇲🇾",
  };

  return map[lang] || null;
}

export default function WorkCoverBadges({ work }: { work: WorkBadgeInput }) {
  const type = normalize(work.type) || "WORK";
  const publishLabel = publishTypeLabel(work.publishType);
  const flag = originFlagEmoji(work);
  const updatedAt = work.updatedAt ? new Date(work.updatedAt as any) : null;
  const isUp = !!updatedAt && Date.now() - +updatedAt < 24 * 60 * 60 * 1000;

  return (
    <>
      {flag ? (
        <div
          className="absolute top-2 right-2 z-10 text-[12px] leading-none px-2 py-1 rounded-full bg-black/40 text-white backdrop-blur"
          title="Origin"
          aria-label="Origin"
        >
          <OriginFlag emoji={flag} />
        </div>
      ) : null}

      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        <span className={`inline-flex items-center justify-center text-[10px] px-2 py-1 rounded-full ${typeBadgeClass(type)}`}>{type}</span>
        {publishLabel ? (
          <span className="inline-flex items-center justify-center text-[10px] px-2 py-1 rounded-full bg-black/55 text-white backdrop-blur">{publishLabel}</span>
        ) : null}
        {work.isMature ? (
          <span className="inline-flex items-center justify-center text-[10px] px-2 py-1 rounded-full bg-black/75 text-white backdrop-blur">18+</span>
        ) : null}
        {isUp ? (
          <span className="inline-flex items-center justify-center text-[10px] px-2 py-1 rounded-full bg-emerald-600/90 text-white font-extrabold">UP</span>
        ) : null}
      </div>
    </>
  );
}
