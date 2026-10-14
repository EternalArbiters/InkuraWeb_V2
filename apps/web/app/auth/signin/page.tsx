"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { FaGoogle } from "react-icons/fa";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import { useIsInkuraApp } from "@/hooks/useIsInkuraApp";

function SignInInner() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params?.get("callbackUrl") || "/home";
  const t = useUILanguageText("Page Sign In");
  // v31: Google blocks its OAuth flow inside embedded WebViews
  // ("disallowed_useragent"), so the APK offers email/username login only.
  const isApp = useIsInkuraApp();
  const tErrors = useUILanguageText("Shared Errors");
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
      setError(tErrors("Login failed."));
      return;
    }
    if (res.error) {
      setError(tErrors("Incorrect email/username or password."));
      return;
    }

    router.push(res.url || callbackUrl);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#fbfcfe] via-[#f2f6fa] to-[#f4faff] dark:from-[#0b1220] dark:via-[#141d2c] dark:to-[#1d2839]">
      <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl shadow-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("Sign in to Inkura")}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{t("Use your email or username.")}</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            placeholder={t("Email or username")}
            autoComplete="username"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
            placeholder={t("Password")}
            autoComplete="current-password"
          />

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
          >
            {loading ? t("Processing...") : t("Sign In")}
          </button>
        </form>

        {!isApp && (
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="mt-3 w-full py-3 rounded-xl font-semibold border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50 hover:brightness-105 flex items-center justify-center gap-2"
          >
            <FaGoogle /> {t("Continue with Google")}
          </button>
        )}

        <div className="mt-3 text-sm">
          <Link href="/auth/forgot" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
            {t("Forgot password?")}
          </Link>
        </div>

        <div className="mt-4 text-sm text-gray-700 dark:text-gray-200">
          {t("Don't have an account?")}{" "}
          <Link href="/auth/signup" className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
            {t("Sign Up")}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SignInPage() {
  const tErrors = useUILanguageText("Shared Errors");

  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#fbfcfe] via-[#f2f6fa] to-[#f4faff] dark:from-[#0b1220] dark:via-[#141d2c] dark:to-[#1d2839]">
          <div className="text-sm text-gray-600 dark:text-gray-300">{tErrors("Loading...")}</div>
        </main>
      }
    >
      <SignInInner />
    </Suspense>
  );
}
