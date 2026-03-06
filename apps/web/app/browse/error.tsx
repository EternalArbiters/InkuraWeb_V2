"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function BrowseError({ error, reset }: Props) {
  return (
    <ErrorView
      title="Browse bermasalah"
      message="Terjadi kesalahan saat memuat daftar karya. Coba lagi."
      error={error}
      reset={reset}
      homeHref="/browse"
      backHref="/browse"
    />
  );
}
