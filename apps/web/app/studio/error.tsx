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
      title={t("Studio error")}
      message={t("An error occurred while loading Studio. Try again or return to the works list.")}
      error={error}
      reset={reset}
      homeHref="/studio"
      backHref="/studio"
    />
  );
}
