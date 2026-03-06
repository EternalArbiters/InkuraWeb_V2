"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalErrorBoundary({ error, reset }: Props) {
  return (
    <ErrorView
      title="Terjadi Kesalahan"
      message="Ada yang bermasalah di sisi aplikasi. Kamu bisa coba lagi."
      error={error}
      reset={reset}
      homeHref="/home"
    />
  );
}
