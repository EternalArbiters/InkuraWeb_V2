"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: Props) {
  const t = useUILanguageText("Page Admin");

  return (
    <ErrorView
      title={t("Admin page error")}
      message={t("An error occurred while loading the Admin page. Try again or return to the admin dashboard.")}
      error={error}
      reset={reset}
      homeHref="/admin"
      backHref="/admin"
    />
  );
}
