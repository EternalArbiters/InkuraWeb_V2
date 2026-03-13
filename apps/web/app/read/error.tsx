"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StageEightError({ error, reset }: Props) {
  const t = useUILanguageText("Page Error States");

  return (
    <ErrorView
      title={t("Reader error")}
      message={t("An error occurred while loading the chapter. Try again or return to the work page.")}
      error={error}
      reset={reset}
      homeHref="/browse"
      backHref="/browse"
    />
  );
}
