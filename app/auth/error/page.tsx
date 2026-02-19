"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  let message = "Terjadi kesalahan yang tidak diketahui.";

  switch (error) {
    case "CredentialsSignin":
      message = "Email atau password salah. Silakan coba lagi.";
      break;
    case "AccessDenied":
      message = "Akses ditolak. Anda tidak memiliki izin.";
      break;
    case "Configuration":
      message = "Konfigurasi otentikasi bermasalah.";
      break;
    case "Verification":
      message = "Verifikasi gagal atau link sudah kadaluarsa.";
      break;
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gagal Masuk</h1>
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-200">{message}</p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white font-semibold"
        >
          Kembali
        </Link>
      </div>
    </main>
  );
}
