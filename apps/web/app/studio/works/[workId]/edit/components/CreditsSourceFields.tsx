"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

export default function CreditsSourceFields({
  needsSource,
  publishType,
  originalAuthorCredit,
  setOriginalAuthorCredit,
  originalTranslatorCredit,
  setOriginalTranslatorCredit,
  sourceUrl,
  setSourceUrl,
  uploaderNote,
  setUploaderNote,
  companyCredit,
  setCompanyCredit,
}: {
  needsSource: boolean;
  publishType: string;
  originalAuthorCredit: string;
  setOriginalAuthorCredit: (v: string) => void;
  originalTranslatorCredit: string;
  setOriginalTranslatorCredit: (v: string) => void;
  sourceUrl: string;
  setSourceUrl: (v: string) => void;
  uploaderNote: string;
  setUploaderNote: (v: string) => void;
  companyCredit: string;
  setCompanyCredit: (v: string) => void;
}) {
  const t = useUILanguageText();
  if (!needsSource) return null;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div className="text-sm font-semibold">{t("Credit & source")}</div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold">{t("Original author credit (required)")}</span>
        <input
          value={originalAuthorCredit}
          onChange={(e) => setOriginalAuthorCredit(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        />
      </label>

      {publishType === "REUPLOAD" ? (
        <label className="grid gap-2">
          <span className="text-sm font-semibold">{t("Original translator credit (required)")}</span>
          <input
            value={originalTranslatorCredit}
            onChange={(e) => setOriginalTranslatorCredit(e.target.value)}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
            placeholder={t("Example: Translator name / group")}
          />
        </label>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-semibold">{t("Source URL (required)")}</span>
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        />
      </label>


      <label className="grid gap-2">
        <span className="text-sm font-semibold">{t("Publisher (optional)")}</span>
        <input
          value={companyCredit}
          onChange={(e) => setCompanyCredit(e.target.value)}
          className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          placeholder={t("Example: Kakao, Naver, Shueisha, etc.")}
        />
      </label>

      {publishType === "REUPLOAD" ? (
        <label className="grid gap-2">
          <span className="text-sm font-semibold">{t("Uploader note (optional)")}</span>
          <textarea
            value={uploaderNote}
            onChange={(e) => setUploaderNote(e.target.value)}
            rows={3}
            className="px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          />
        </label>
      ) : null}
    </div>
  );
}
