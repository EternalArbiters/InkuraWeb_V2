"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

type AdminDonorPanelLabels = {
  adminDonorTools: string;
  adminDonorToolsHint: string;
  openManualInput: string;
  closeManualInput: string;
  usernameOrEmail: string;
  amount: string;
  currency: string;
  donationDate: string;
  noteOptional: string;
  saveDonorEntry: string;
  saving: string;
  rebuildCommunitySnapshots: string;
  rebuilding: string;
  donorTotals: string;
  donorTotalsHint: string;
  rank: string;
  donor: string;
  total: string;
  entries: string;
  latestDonation: string;
  noDonorDataYet: string;
  noDate: string;
  top7Rule: string;
  greedLabel: string;
  openFullDonorLedger: string;
  donorEntrySavedAndRebuilt: string;
  failedToCreateDonationEntry: string;
  failedToRebuildCommunitySnapshots: string;
};

type AdminDonorPanelProps = {
  initial: {
    donorTotals: Array<{
      rank: number;
      userId: string;
      username: string | null;
      name: string | null;
      image: string | null;
      email: string | null;
      score: number;
      donationCount: number;
      currency: string;
      currencies: string[];
      latestDonatedAt: string | null;
    }>;
  };
  labels: AdminDonorPanelLabels;
};

function formatAmount(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency || "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDateTime(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString();
}

function displayUserName(user: { name: string | null; username: string | null; email?: string | null }) {
  return user.name || (user.username ? `@${user.username}` : user.email || "User");
}

function toneClasses(rank: number) {
  const tones = [
    "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-200",
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200",
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200",
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-200",
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200",
  ];
  return tones[Math.max(0, Math.min(rank - 1, tones.length - 1))] || tones[0];
}

export default function AdminDonorPanel({ initial, labels }: AdminDonorPanelProps) {
  const router = useRouter();
  const [target, setTarget] = React.useState("@");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("IDR");
  const [donatedAt, setDonatedAt] = React.useState("");
  const [note, setNote] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<"create" | "rebuild" | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const resetForm = React.useCallback(() => {
    setTarget("@");
    setAmount("");
    setCurrency("IDR");
    setDonatedAt("");
    setNote("");
  }, []);

  async function rebuildSnapshots() {
    setBusy("rebuild");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/community/rebuild", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || labels.failedToRebuildCommunitySnapshots);
      setMessage(labels.donorEntrySavedAndRebuilt);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.failedToRebuildCommunitySnapshots);
    } finally {
      setBusy(null);
    }
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/community/donations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          target,
          amount,
          currency,
          donatedAt: donatedAt || undefined,
          note,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || labels.failedToCreateDonationEntry);

      const rebuildResponse = await fetch("/api/admin/community/rebuild", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const rebuildData = await rebuildResponse.json().catch(() => null);
      if (!rebuildResponse.ok) throw new Error(rebuildData?.error || labels.failedToRebuildCommunitySnapshots);

      resetForm();
      setIsOpen(false);
      setMessage(labels.donorEntrySavedAndRebuilt);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : labels.failedToCreateDonationEntry);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight md:text-xl">{labels.adminDonorTools}</h2>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">{labels.adminDonorToolsHint}</div>
          <div className="mt-2 inline-flex items-center rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700 dark:border-yellow-900/60 dark:bg-yellow-950/40 dark:text-yellow-200">
            {labels.top7Rule}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsOpen((value) => !value)}
            className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            {isOpen ? labels.closeManualInput : labels.openManualInput}
          </button>
          <button
            type="button"
            onClick={rebuildSnapshots}
            disabled={busy === "rebuild"}
            className="rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-950/60"
          >
            {busy === "rebuild" ? labels.rebuilding : labels.rebuildCommunitySnapshots}
          </button>
          <Link
            href="/admin/community"
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            {labels.openFullDonorLedger}
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      {isOpen ? (
        <form onSubmit={submitCreate} className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-semibold">{labels.usernameOrEmail}</label>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
              placeholder="@username"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold">{labels.amount}</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
              placeholder="50000"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold">{labels.currency}</label>
            <input
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={8}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 uppercase dark:border-gray-800 dark:bg-gray-900"
              placeholder="IDR"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold">{labels.donationDate}</label>
            <input
              value={donatedAt}
              onChange={(e) => setDonatedAt(e.target.value)}
              type="datetime-local"
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <label className="text-sm font-semibold">{labels.noteOptional}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={busy === "create"}
              className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "create" ? labels.saving : labels.saveDonorEntry}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-extrabold tracking-tight md:text-lg">{labels.donorTotals}</h3>
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{labels.donorTotalsHint}</span>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                <th className="px-3 py-2">{labels.rank}</th>
                <th className="px-3 py-2">{labels.donor}</th>
                <th className="px-3 py-2">{labels.total}</th>
                <th className="px-3 py-2">{labels.entries}</th>
                <th className="px-3 py-2">{labels.latestDonation}</th>
              </tr>
            </thead>
            <tbody>
              {initial.donorTotals.length ? (
                initial.donorTotals.map((entry) => (
                  <tr key={entry.userId} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-[#08152f]">
                    <td className="px-3 py-3">
                      <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${entry.rank <= 7 ? toneClasses(entry.rank) : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"}`}>
                        #{entry.rank}
                        {entry.rank === 1 ? <span>{labels.greedLabel}</span> : null}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{displayUserName(entry)}</div>
                      {entry.username ? <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">@{entry.username}</div> : null}
                    </td>
                    <td className="px-3 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200">{formatAmount(entry.score, entry.currency)}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">{entry.donationCount}</td>
                    <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">{formatDateTime(entry.latestDonatedAt, labels.noDate)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-5">
                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-300">
                      {labels.noDonorDataYet}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
