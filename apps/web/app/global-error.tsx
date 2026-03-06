"use client";

import ErrorView from "@/app/components/errors/ErrorView";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <ErrorView
          title="Terjadi Kesalahan"
          message="Ada kesalahan fatal di aplikasi. Kamu bisa coba lagi."
          error={error}
          reset={reset}
          homeHref="/home"
        />
      </body>
    </html>
  );
}
