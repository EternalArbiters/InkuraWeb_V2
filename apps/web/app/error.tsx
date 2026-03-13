"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorBoundary({ error, reset }: Props) {
  const t = useUILanguageText("Page Error States");

  return (
    <ErrorView
      title={t("An Error Occurred")}
      message={t("Something went wrong on the application side. You can try again.")}
      error={error}
      reset={reset}
      homeHref="/home"
    />
  );
}
