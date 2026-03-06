"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SearchError({ error, reset }: Props) {
  return (
    <ErrorView
      title="Pencarian bermasalah"
      message="Terjadi kesalahan saat memuat hasil pencarian. Coba lagi."
      error={error}
      reset={reset}
      homeHref="/search"
      backHref="/search"
    />
  );
}
