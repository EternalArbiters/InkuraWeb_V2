"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function WorkSlugError({ error, reset }: Props) {
  return (
    <ErrorView
      title="Gagal memuat karya"
      message="Terjadi kesalahan saat memuat halaman karya. Coba lagi."
      error={error}
      reset={reset}
      homeHref="/browse"
      backHref="/browse"
    />
  );
}
