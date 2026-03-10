"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "PREFER_NOT_TO_SAY", label: "Prefer not to say" },
];

type Props = {
  initial: {
    gender?: string | null;
    birthMonth?: number | null;
    birthYear?: number | null;
  };
};

export default function OnboardingForm({ initial }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const [gender, setGender] = useState(initial.gender || "PREFER_NOT_TO_SAY");
  const [birthMonth, setBirthMonth] = useState<number | "">(initial.birthMonth || "");
  const [birthYear, setBirthYear] = useState<number | "">(initial.birthYear || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1899 }, (_, index) => currentYear - index);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/me/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender, birthMonth, birthYear }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof payload?.error === "string" ? payload.error : "Failed to save");
      }
      await update();
      router.replace("/home");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#09142d] p-6 text-white shadow-2xl shadow-blue-950/30 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.28),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.20),_transparent_28%)]" />
      <div className="relative">
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 shadow-lg shadow-black/20">
            <Image src="/logo-inkura.png" alt="Inkura" fill className="object-contain p-2" sizes="56px" priority />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200/70">Welcome to Inkura</div>
            <h1 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">Set up your reader profile</h1>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-50/80 md:text-base">
          We only ask a few basics so future analytics and recommendations can understand your audience better. You can edit these later in Profile Settings.
        </p>

        <form onSubmit={onSubmit} className="mt-8 grid gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-sm font-semibold text-white">Gender</div>
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                className="mt-3 w-full rounded-xl border border-white/10 bg-[#0c1a39] px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
              >
                {GENDERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-sm font-semibold text-white">Birth month</div>
              <select
                value={birthMonth}
                onChange={(event) => setBirthMonth(event.target.value ? Number(event.target.value) : "")}
                className="mt-3 w-full rounded-xl border border-white/10 bg-[#0c1a39] px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
              >
                <option value="">Select month</option>
                {MONTHS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <div className="text-sm font-semibold text-white">Birth year</div>
            <select
              value={birthYear}
              onChange={(event) => setBirthYear(event.target.value ? Number(event.target.value) : "")}
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#0c1a39] px-4 py-3 text-sm text-white outline-none focus:border-blue-400"
            >
              <option value="">Select year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-blue-100/65">
              This is used for analytics and can be updated later from your profile page.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-950/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Saving..." : "Continue to Inkura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
