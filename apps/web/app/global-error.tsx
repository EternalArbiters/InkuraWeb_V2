"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  const t = useUILanguageText("Page Error States");

  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <ErrorView
          title={t("An Error Occurred")}
          message={t("A fatal application error occurred. You can try again.")}
          error={error}
          reset={reset}
          homeHref="/home"
        />
      </body>
    </html>
  );
}
