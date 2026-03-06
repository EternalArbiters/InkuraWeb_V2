"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ReaderError({ error, reset }: Props) {
  return (
    <ErrorView
      title="Reader mengalami kendala"
      message="Terjadi kesalahan saat memuat chapter. Coba lagi atau kembali ke halaman karya."
      error={error}
      reset={reset}
      homeHref="/browse"
      backHref="/browse"
    />
  );
}
