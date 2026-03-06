"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function StudioError({ error, reset }: Props) {
  return (
    <ErrorView
      title="Studio mengalami kendala"
      message="Terjadi kesalahan saat memuat Studio. Coba lagi atau kembali ke daftar karya."
      error={error}
      reset={reset}
      homeHref="/studio"
      backHref="/studio"
    />
  );
}
