"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

// v30: minimal, bespoke credentials form embedded directly on the private landing
// page — deliberately NOT the shared /auth/signin page (no OAuth buttons, no
// "forgot password"/"sign up" links, and the identifier field's placeholder is
// intentionally coy ("I'm Owner") rather than "Email or username").
export default function PrivateLoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: identifier,
        password,
        callbackUrl: "/home",
      });

      if (!res || res.error) {
        setError("Incorrect credentials.");
        return;
      }

      router.push(res.url || "/home");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-xs space-y-3">
      <input
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="I'm Owner"
        autoComplete="username"
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-purple-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-purple-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
      />
      {error ? <p className="text-sm text-red-500 dark:text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
