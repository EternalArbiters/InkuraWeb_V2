"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

type Props = {
  adultConfirmed: boolean;
  onChange: (next: boolean) => void;
};

export default function AdultConfirmCard({ adultConfirmed, onChange }: Props) {
  const t = useUILanguageText("Page Settings Account");

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
      <div className="text-sm font-semibold">{t("Mature / 18+")}</div>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={adultConfirmed} onChange={(e) => onChange(e.target.checked)} />
        <span className="text-sm font-semibold">{t("I'm 18+ (Unlock it)")}</span>
      </label>
    </div>
  );
}
