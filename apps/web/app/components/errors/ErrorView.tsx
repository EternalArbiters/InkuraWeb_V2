"use client";

import Link from "next/link";
import { useEffect } from "react";

type Props = {
  title?: string;
  message?: string;
  homeHref?: string;
  backHref?: string;
  error?: Error & { digest?: string };
  reset?: () => void;
};

export default function ErrorView({
  title = "Terjadi Kesalahan",
  message = "Maaf, terjadi kesalahan saat memuat halaman ini.",
  homeHref = "/home",
  backHref,
  error,
  reset,
}: Props) {
  useEffect(() => {
    // In dev, keep the error visible in the console.
    if (error) console.error(error);
  }, [error]);

  const showDebug = process.env.NODE_ENV !== "production";

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-2xl p-6">
        <div className="text-sm text-gray-500 dark:text-gray-400">Inkura</div>
        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{message}</p>

        {error?.digest && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Error ID:</span> {error.digest}
          </div>
        )}

        {showDebug && error?.message ? (
          <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-black/80 text-white text-xs p-3 whitespace-pre-wrap">
            {error.message}
          </pre>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {reset ? (
            <button
              onClick={() => reset()}
              className="px-4 py-2 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110"
            >
              Coba lagi
            </button>
          ) : null}

          {backHref ? (
            <Link
              href={backHref}
              className="px-4 py-2 rounded-xl font-semibold border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50 hover:brightness-105"
            >
              Kembali
            </Link>
          ) : null}

          <Link
            href={homeHref}
            className="px-4 py-2 rounded-xl font-semibold border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50 hover:brightness-105"
          >
            Ke Beranda
          </Link>
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
          Kalau ini terus terjadi, coba refresh halaman atau login ulang. Jika perlu, laporkan ke admin.
        </p>
      </div>
    </main>
  );
}
