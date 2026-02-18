"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = React.useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) return setError("Token tidak ada di URL.");
    if (password.length < 6) return setError("Password minimal 6 karakter.");
    if (password !== confirm) return setError("Konfirmasi password tidak sama.");

    setStatus("loading");
    const res = await fetch("/api/auth/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setError(json?.error || "Gagal reset password.");
      return;
    }

    setStatus("ok");
    // After reset, go to landing/login
    setTimeout(() => router.push("/?login=1"), 800);
  }

  return (
    <div className="min-h-screen bg-[#0B0B10] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
        <h1 className="text-xl font-semibold">Reset Password</h1>
        <p className="mt-2 text-sm text-white/70">
          Masukkan password baru kamu. Link reset berlaku terbatas.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-sm text-white/80">Password baru</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div>
            <label className="text-sm text-white/80">Konfirmasi password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/30 border border-white/10 px-3 py-2 outline-none focus:border-white/30"
              placeholder="Ulangi password"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-xl bg-white text-black font-medium py-2 hover:bg-white/90 disabled:opacity-60"
          >
            {status === "loading" ? "Memproses..." : status === "ok" ? "Berhasil! Mengalihkan..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-4 text-xs text-white/50">
          Kalau link error/expired, minta ulang lewat menu “Forgot password”.
        </div>
      </div>
    </div>
  );
}
