"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setToken(null);

    const id = identifier.trim();
    if (!id) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: id }),
      });
      const json = await res.json().catch(() => ({} as any));

      setMessage(
        "Kalau akun ditemukan, instruksi reset password sudah dibuat. (Untuk produksi, hubungkan email. Kalau kamu butuh token ditampilkan, set env SHOW_RESET_TOKEN=1)"
      );
      if (json?.resetToken) {
        setToken(String(json.resetToken));
      }
    } catch {
      setMessage("Terjadi error. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#fdfbff] via-[#f8f5ff] to-[#f4faff] dark:from-[#0a0a1a] dark:via-[#151629] dark:to-[#1b1c34]">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl shadow-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lupa password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Masukkan email atau username.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Email atau username"
            autoComplete="username"
          />

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Buat token reset"}
          </button>
        </form>

        {message ? (
          <div className="mt-4 text-sm text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-950/30 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2">
            {message}
          </div>
        ) : null}

        {token ? (
          <div className="mt-4 rounded-xl border border-yellow-200 dark:border-yellow-900 bg-yellow-50/70 dark:bg-yellow-950/30 p-3">
            <div className="text-xs font-semibold text-yellow-800 dark:text-yellow-200">Reset token (debug)</div>
            <div className="mt-1 text-xs break-all font-mono text-yellow-900 dark:text-yellow-100">{token}</div>
            <Link
              href={`/auth/reset?token=${encodeURIComponent(token)}`}
              className="mt-2 inline-block text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Lanjut reset password →
            </Link>
          </div>
        ) : null}

        <div className="mt-4 text-sm text-gray-700 dark:text-gray-200">
          <Link href="/auth/signin" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
            Kembali ke login
          </Link>
        </div>
      </div>
    </main>
  );
}
