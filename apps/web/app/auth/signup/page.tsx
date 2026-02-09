"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Gagal daftar.");
        setLoading(false);
        return;
      }

      const login = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password,
        callbackUrl: "/home",
      });

      setLoading(false);
      if (login?.error) {
        router.push("/auth/signin");
        return;
      }
      router.push(login?.url || "/home");
    } catch (e) {
      console.error(e);
      setError("Gagal daftar. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#fdfbff] via-[#f8f5ff] to-[#f4faff] dark:from-[#0a0a1a] dark:via-[#151629] dark:to-[#1b1c34]">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl shadow-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Daftar Inkura</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Buat akun untuk upload dan membaca.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Nama tampilan (opsional)"
            autoComplete="name"
          />
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Username"
            autoComplete="username"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Email"
            autoComplete="email"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Password (min 6)"
            autoComplete="new-password"
          />
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Konfirmasi password"
            autoComplete="new-password"
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
            {loading ? "Memproses..." : "Daftar"}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-700 dark:text-gray-200">
          Sudah punya akun?{" "}
          <Link href="/auth/signin" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
            Masuk
          </Link>
        </div>
      </div>
    </main>
  );
}
