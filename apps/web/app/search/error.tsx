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
      title={t("Search error")}
      message={t("An error occurred while loading the search results. Please try again.")}
      error={error}
      reset={reset}
      homeHref="/search"
      backHref="/search"
    />
  );
}
