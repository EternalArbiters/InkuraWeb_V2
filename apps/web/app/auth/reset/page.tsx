"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

function ResetInner() {
  const router = useRouter();
  const params = useSearchParams();

  const token = useMemo(() => params?.get("token") || "", [params]);

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) return setError("Token tidak ada.");
    if (password.length < 6) return setError("Password minimal 6 karakter.");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(json?.error || "Gagal reset password");

      setOk(true);
      setTimeout(() => router.push("/auth/signin"), 800);
    } catch (e: any) {
      setError(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#fdfbff] via-[#f8f5ff] to-[#f4faff] dark:from-[#0a0a1a] dark:via-[#151629] dark:to-[#1b1c34]">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl shadow-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset password</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Masukkan password baru.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Password baru"
            autoComplete="new-password"
          />

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {ok && (
            <div className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl px-3 py-2">
              Password berhasil diubah. Mengarahkan ke login...
            </div>
          )}

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Reset"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-700 dark:text-gray-200">
          <Link href="/auth/forgot" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
            Kembali
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#fdfbff] via-[#f8f5ff] to-[#f4faff] dark:from-[#0a0a1a] dark:via-[#151629] dark:to-[#1b1c34]">
          <div className="text-sm text-gray-600 dark:text-gray-300">Memuat...</div>
        </main>
      }
    >
      <ResetInner />
    </Suspense>
  );
}
