"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

type AdminCommunityPageData = {
  donationEntries: Array<{
    id: string;
    amount: number;
    currency: string;
    note: string | null;
    donatedAt: string;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      username: string | null;
      name: string | null;
      image: string | null;
      email: string | null;
    };
    createdByAdmin: {
      id: string;
      username: string | null;
      name: string | null;
    };
  }>;
  topDonors: Array<{
    userId: string;
    username: string | null;
    name: string | null;
    score: number;
    rank: number;
    metadata: Record<string, unknown> | null;
  }>;
  specialWinners: Array<{
    badgeKey: string;
    label: string;
    userId: string;
    username: string | null;
    name: string | null;
  }>;
  latestMainSnapshotAt: string | null;
  latestSpecialSnapshotAt: string | null;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function formatAmount(value: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: currency || "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function displayUserName(user: { name: string | null; username: string | null }) {
  return user.name || (user.username ? `@${user.username}` : "User");
}

function toLocalDateTimeInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const shifted = new Date(date.getTime() - offset * 60000);
  return shifted.toISOString().slice(0, 16);
}

function toneClasses(index: number) {
  const tones = [
    "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-200",
    "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200",
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200",
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/40 dark:text-orange-200",
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200",
  ];
  return tones[Math.max(0, Math.min(index, tones.length - 1))] || tones[0];
}

export default function AdminCommunityClient({ initial }: { initial: AdminCommunityPageData }) {
  const router = useRouter();
  const [target, setTarget] = React.useState("@");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("IDR");
  const [donatedAt, setDonatedAt] = React.useState("");
  const [note, setNote] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editAmount, setEditAmount] = React.useState("");
  const [editCurrency, setEditCurrency] = React.useState("IDR");
  const [editDonatedAt, setEditDonatedAt] = React.useState("");
  const [editNote, setEditNote] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const startEdit = React.useCallback((entry: AdminCommunityPageData["donationEntries"][number]) => {
    setEditingId(entry.id);
    setEditAmount(String(entry.amount));
    setEditCurrency(entry.currency || "IDR");
    setEditDonatedAt(toLocalDateTimeInput(entry.donatedAt));
    setEditNote(entry.note || "");
  }, []);

  const resetCreateForm = React.useCallback(() => {
    setTarget("@");
    setAmount("");
    setCurrency("IDR");
    setDonatedAt("");
    setNote("");
  }, []);

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
      if (!response.ok) throw new Error(data?.error || "Failed to create donation entry");
      resetCreateForm();
      setMessage("Donation entry saved. Rebuild community snapshots when you want ranking and badges to refresh.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create donation entry");
    } finally {
      setBusy(null);
    }
  }

  async function submitUpdate(entryId: string) {
    setBusy(`update:${entryId}`);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/community/donations/${entryId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: editAmount,
          currency: editCurrency,
          donatedAt: editDonatedAt || undefined,
          note: editNote,
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Failed to update donation entry");
      setEditingId(null);
      setMessage("Donation entry updated. Rebuild community snapshots when you want ranking and badges to refresh.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update donation entry");
    } finally {
      setBusy(null);
    }
  }

  async function removeEntry(entryId: string) {
    if (!window.confirm("Delete this donation entry?")) return;
    setBusy(`delete:${entryId}`);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/community/donations/${entryId}`, {
        method: "DELETE",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Failed to delete donation entry");
      if (editingId === entryId) setEditingId(null);
      setMessage("Donation entry deleted. Rebuild community snapshots when you want ranking and badges to refresh.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete donation entry");
    } finally {
      setBusy(null);
    }
  }

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
      if (!response.ok) throw new Error(data?.error || "Failed to rebuild community snapshots");
      setMessage("Community leaderboard and special badge snapshots rebuilt.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rebuild community snapshots");
    } finally {
      setBusy(null);
    }
  }

  const donationCount = initial.donationEntries.length;
  const topDonor = initial.topDonors[0] || null;

  return (
    <div className="mt-8 space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[24px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Main snapshot</div>
          <div className="mt-3 text-lg font-bold">{formatDateTime(initial.latestMainSnapshotAt)}</div>
        </div>
        <div className="rounded-[24px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Special badge snapshot</div>
          <div className="mt-3 text-lg font-bold">{formatDateTime(initial.latestSpecialSnapshotAt)}</div>
        </div>
        <div className="rounded-[24px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Donation entries</div>
          <div className="mt-3 text-3xl font-black tracking-tight">{donationCount}</div>
        </div>
        <div className="rounded-[24px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Current top donor</div>
          <div className="mt-3 text-lg font-bold">{topDonor ? displayUserName(topDonor) : "No donor ranked yet"}</div>
          {topDonor ? <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{formatAmount(topDonor.score, typeof topDonor.metadata?.currency === "string" ? topDonor.metadata.currency : "IDR")}</div> : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight md:text-xl">Add donor entry</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Use exact @username or email. Admin accounts stay excluded from donor rankings.</p>
            </div>
            <button
              type="button"
              onClick={rebuildSnapshots}
              disabled={busy === "rebuild"}
              className="rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-950/60"
            >
              {busy === "rebuild" ? "Rebuilding..." : "Rebuild community snapshots"}
            </button>
          </div>

          <form onSubmit={submitCreate} className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Target (@username or email)</label>
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
                placeholder="@username"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Amount</label>
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
              <label className="text-sm font-semibold">Currency</label>
              <input
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 uppercase dark:border-gray-800 dark:bg-gray-900"
                placeholder="IDR"
                maxLength={8}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Donation date</label>
              <input
                value={donatedAt}
                onChange={(e) => setDonatedAt(e.target.value)}
                type="datetime-local"
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
              />
            </div>
            <div className="grid gap-2 md:col-span-2">
              <label className="text-sm font-semibold">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
                placeholder="Transfer confirmation, event note, or donor context"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={busy === "create"}
                className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "create" ? "Saving..." : "Save donor entry"}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight md:text-xl">Snapshot preview</h2>
            <Link
              href="/community/ranking"
              className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Open public ranking
            </Link>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Best Donor top 7</div>
            <div className="mt-3 space-y-2">
              {initial.topDonors.length ? (
                initial.topDonors.map((entry, index) => (
                  <div key={entry.userId} className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 px-3 py-3 dark:border-gray-800">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClasses(index)}`}>#{entry.rank}</span>
                        <div className="truncate text-sm font-semibold">{displayUserName(entry)}</div>
                      </div>
                      {entry.username ? <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">@{entry.username}</div> : null}
                    </div>
                    <div className="text-right text-xs font-semibold text-gray-600 dark:text-gray-300">
                      {formatAmount(entry.score, typeof entry.metadata?.currency === "string" ? entry.metadata.currency : "IDR")}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-300">
                  No donor snapshot yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200">Special badge holders</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {initial.specialWinners.length ? (
                initial.specialWinners.map((entry) => (
                  <div key={entry.badgeKey} className="rounded-2xl border border-gray-200 px-3 py-3 dark:border-gray-800">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">{entry.label}</div>
                    <div className="mt-1 text-sm font-semibold">{displayUserName(entry)}</div>
                    {entry.username ? <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">@{entry.username}</div> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-300 sm:col-span-2">
                  No special badge snapshot yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-[28px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-gray-800 dark:bg-[#04112b]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight md:text-xl">Recent donor entries</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Edit the amount, currency, date, or note. Target user stays locked after creation.</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {initial.donationEntries.length ? (
            initial.donationEntries.map((entry) => {
              const isEditing = editingId === entry.id;
              return (
                <div key={entry.id} className="rounded-3xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{displayUserName(entry.user)}</div>
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {entry.user.username ? `@${entry.user.username}` : entry.user.email || "(no handle)"}
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Recorded by {displayUserName(entry.createdByAdmin)} • donated {formatDateTime(entry.donatedAt)}
                      </div>
                    </div>

                    {!isEditing ? (
                      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                        <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                          {formatAmount(entry.amount, entry.currency)}
                        </div>
                        <button
                          type="button"
                          onClick={() => startEdit(entry)}
                          className="rounded-full border border-gray-300 px-3 py-2 text-xs font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.id)}
                          disabled={busy === `delete:${entry.id}`}
                          className="rounded-full border border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/60"
                        >
                          {busy === `delete:${entry.id}` ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {isEditing ? (
                    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Amount</label>
                        <input
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          type="number"
                          min="0"
                          step="0.01"
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Currency</label>
                        <input
                          value={editCurrency}
                          onChange={(e) => setEditCurrency(e.target.value.toUpperCase())}
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 uppercase dark:border-gray-800 dark:bg-gray-900"
                          maxLength={8}
                        />
                      </div>
                      <div className="grid gap-2 xl:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Donation date</label>
                        <input
                          value={editDonatedAt}
                          onChange={(e) => setEditDonatedAt(e.target.value)}
                          type="datetime-local"
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
                        />
                      </div>
                      <div className="grid gap-2 md:col-span-2 xl:col-span-4">
                        <label className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">Note</label>
                        <textarea
                          value={editNote}
                          onChange={(e) => setEditNote(e.target.value)}
                          rows={3}
                          className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
                        />
                      </div>
                      <div className="md:col-span-2 xl:col-span-4 flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => submitUpdate(entry.id)}
                          disabled={busy === `update:${entry.id}`}
                          className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy === `update:${entry.id}` ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    </div>
                  ) : entry.note ? (
                    <div className="mt-4 rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
                      {entry.note}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-300">
              No donor entries recorded yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
