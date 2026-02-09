"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignInInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params?.get("callbackUrl") || "/home";
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      email: identifier,
      password,
      callbackUrl,
    });

    setLoading(false);

    if (!res) {
      setError("Gagal login.");
      return;
    }
    if (res.error) {
      setError("Email/username atau password salah.");
      return;
    }

    router.push(res.url || callbackUrl);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#fdfbff] via-[#f8f5ff] to-[#f4faff] dark:from-[#0a0a1a] dark:via-[#151629] dark:to-[#1b1c34]">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl shadow-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Masuk ke Inkura</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Gunakan email atau username.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Email atau username"
            autoComplete="username"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Password"
            autoComplete="current-password"
          />

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-700 dark:text-gray-200">
          Belum punya akun?{" "}
          <Link href="/auth/signup" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
            Daftar
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#fdfbff] via-[#f8f5ff] to-[#f4faff] dark:from-[#0a0a1a] dark:via-[#151629] dark:to-[#1b1c34]">
          <div className="text-sm text-gray-600 dark:text-gray-300">Memuat...</div>
        </main>
      }
    >
      <SignInInner />
    </Suspense>
  );
}
