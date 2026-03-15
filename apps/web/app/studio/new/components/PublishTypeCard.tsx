"use client";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

export default function PublishTypeCard({
  publishType,
  setPublishType,
  originalAuthorCredit,
  setOriginalAuthorCredit,
  originalTranslatorCredit,
  setOriginalTranslatorCredit,
  sourceUrl,
  setSourceUrl,
  companyCredit,
  setCompanyCredit,
  uploaderNote,
  setUploaderNote,
}: {
  publishType: "ORIGINAL" | "TRANSLATION" | "REUPLOAD";
  setPublishType: (v: "ORIGINAL" | "TRANSLATION" | "REUPLOAD") => void;
  originalAuthorCredit: string;
  setOriginalAuthorCredit: (v: string) => void;
  originalTranslatorCredit: string;
  setOriginalTranslatorCredit: (v: string) => void;
  sourceUrl: string;
  setSourceUrl: (v: string) => void;
  companyCredit: string;
  setCompanyCredit: (v: string) => void;
  uploaderNote: string;
  setUploaderNote: (v: string) => void;
}) {
  const t = useUILanguageText();
  const needsSource = publishType !== "ORIGINAL";

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div className="grid gap-1">
        <div className="text-sm font-semibold">{t("Publish type")}</div>
      </div>

      <select
        value={publishType}
        onChange={(e) => setPublishType(e.target.value as any)}
        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
      >
        <option value="ORIGINAL">{t("Original (Author)")}</option>
        <option value="TRANSLATION">{t("Translation (Translator)")}</option>
        <option value="REUPLOAD">{t("Reupload (Reuploader)")}</option>
      </select>

      {needsSource ? (
        <div className="rounded-2xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50/60 dark:bg-yellow-950/40 p-4 text-sm">
          <div className="font-semibold">{t("Copyright warning")}</div>
          <div className="mt-1 text-sm">
            {t("If the rights holder reports a copyright violation, you may be held responsible. To avoid harm to Inkura, readers, and yourself, you will be given 1 week after notification to remove the work. If it is not removed within that time, Inkura will remove it automatically.")}
          </div>
        </div>
      ) : null}

      {needsSource ? (
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-sm font-semibold">{t("Original author credit (required)")}</label>
            <input
              value={originalAuthorCredit}
              onChange={(e) => setOriginalAuthorCredit(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder={t("Example: Original author name / studio / etc.")}
            />
          </div>

          {publishType === "REUPLOAD" ? (
            <div className="grid gap-1">
              <label className="text-sm font-semibold">{t("Original translator credit (required)")}</label>
              <input
                value={originalTranslatorCredit}
                onChange={(e) => setOriginalTranslatorCredit(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
                placeholder={t("Example: Translator name / group")}
              />
            </div>
          ) : null}

          <div className="grid gap-1">
            <label className="text-sm font-semibold">{t("Source URL (required)")}</label>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder={t("Link source / raw / original posting")}
            />
          </div>


          <div className="grid gap-1">
            <label className="text-sm font-semibold">{t("Company / Publisher (optional)")}</label>
            <input
              value={companyCredit}
              onChange={(e) => setCompanyCredit(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder={t("Example: Kakao, Naver, Shueisha, etc.")}
            />
          </div>

          {publishType === "REUPLOAD" ? (
            <div className="grid gap-1">
              <label className="text-sm font-semibold">{t("Notes (optional)")}</label>
              <textarea
                value={uploaderNote}
                onChange={(e) => setUploaderNote(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm min-h-[88px]"
                placeholder={t("Example: reupload reason, additional info, etc.")}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
