"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminError({ error, reset }: Props) {
  return (
    <ErrorView
      title="Halaman Admin bermasalah"
      message="Terjadi kesalahan saat memuat halaman Admin. Coba lagi atau kembali ke dashboard admin."
      error={error}
      reset={reset}
      homeHref="/admin"
      backHref="/admin"
    />
  );
}
