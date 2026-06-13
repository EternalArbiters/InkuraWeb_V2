"use client";

import * as React from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

const PAYMENT_OPTIONS = [
  "BCA","Mandiri","BRI","BNI","BSI","GoPay","OVO","DANA","ShopeePay","LinkAja","Other",
];

type Tab = "settings" | "sent" | "received";

type DonationSent = {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  adminNote: string | null;
  forwardedAt: string | null;
  createdAt: string;
  recipientUser: { id: string; username: string | null; name: string | null };
};

type DonationReceived = {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  adminNote: string | null;
  forwardedAt: string | null;
  createdAt: string;
  donorUser: { id: string; username: string | null; name: string | null } | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatIDR(amount: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  PENDING:   { label: "Pending",   cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",  dot: "bg-amber-400" },
  VERIFIED:  { label: "Verified",  cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",      dot: "bg-blue-400" },
  FORWARDED: { label: "Forwarded", cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",  dot: "bg-green-400" },
  REJECTED:  { label: "Rejected",  cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",          dot: "bg-red-400" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: "bg-gray-100 text-gray-700", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Payout settings form ──────────────────────────────────────────────────

function PayoutForm() {
  const [bankName, setBankName] = React.useState("");
  const [customBank, setCustomBank] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [holderName, setHolderName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/me/payout")
      .then((r) => r.json())
      .then((data) => {
        if (data?.payoutInfo) {
          const { bankName: bn, accountNumber: an, holderName: hn, notes: n } = data.payoutInfo;
          const isPreset = PAYMENT_OPTIONS.includes(bn) && bn !== "Other";
          setBankName(isPreset ? bn : bn ? "Other" : "");
          setCustomBank(isPreset ? "" : bn);
          setAccountNumber(an || "");
          setHolderName(hn || "");
          setNotes(n || "");
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const finalBank = bankName === "Other" ? customBank.trim() : bankName;
    if (!finalBank) { setError("Please select or enter a payment method."); return; }
    if (!accountNumber.trim()) { setError("Account number is required."); return; }
    if (!holderName.trim()) { setError("Account holder name is required."); return; }
    setPending(true);
    try {
      const res = await fetch("/api/me/payout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName: finalBank, accountNumber: accountNumber.trim(), holderName: holderName.trim(), notes: notes.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to save.");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setPending(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white";
  const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";

  if (!loaded) return <div className="py-12 text-center text-sm text-gray-400">Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Admin uses this info to forward donation funds to you. Keep it up to date.
      </p>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-5 space-y-4">
        <div>
          <label className={labelCls}>Bank / E-wallet <span className="text-red-500">*</span></label>
          <select value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={pending} className={inputCls}>
            <option value="">— Pilih —</option>
            {PAYMENT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {bankName === "Other" && (
          <div>
            <label className={labelCls}>Nama metode <span className="text-red-500">*</span></label>
            <input type="text" value={customBank} onChange={(e) => setCustomBank(e.target.value)} placeholder="e.g. Jenius, SeaBank" maxLength={100} disabled={pending} className={inputCls} />
          </div>
        )}

        <div>
          <label className={labelCls}>No. Rekening / No. HP <span className="text-red-500">*</span></label>
          <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 1234567890" maxLength={50} disabled={pending} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Nama pemilik <span className="text-red-500">*</span></label>
          <input type="text" value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Nama sesuai rekening" maxLength={100} disabled={pending} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Catatan <span className="font-normal normal-case text-gray-400">(opsional)</span></label>
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. BCA Syariah, info tambahan untuk admin" maxLength={200} disabled={pending} className={inputCls} />
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>}
      {saved && <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">Tersimpan!</p>}

      <button type="submit" disabled={pending} className="w-full rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}

// ─── Donation card (sent) ──────────────────────────────────────────────────

function SentCard({ d }: { d: DonationSent }) {
  const recipient = d.recipientUser;
  const name = recipient.name?.trim() || recipient.username?.trim() || "Unknown";
  return (
    <div className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-4 transition hover:border-violet-200 dark:hover:border-violet-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={d.status} />
            <span className="text-xs text-gray-400">{timeAgo(d.createdAt)}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">To</div>
          <div className="font-semibold text-sm text-gray-900 dark:text-white">
            {recipient.username ? (
              <Link href={`/u/${recipient.username}`} className="hover:text-violet-600 dark:hover:text-violet-400">{name}</Link>
            ) : name}
          </div>
          {d.message && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic">&ldquo;{d.message}&rdquo;</p>}
          {d.adminNote && (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold not-italic">Admin note:</span> {d.adminNote}
            </p>
          )}
          {d.status === "FORWARDED" && d.forwardedAt && (
            <p className="mt-1.5 text-xs text-green-600 dark:text-green-400">✓ Forwarded {timeAgo(d.forwardedAt)}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-extrabold text-green-600 dark:text-green-400">{formatIDR(d.amount, d.currency)}</div>
          <div className="text-xs font-mono text-gray-400 mt-0.5">#{d.id.slice(-8)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Donation card (received) ──────────────────────────────────────────────

function ReceivedCard({ d }: { d: DonationReceived }) {
  return (
    <div className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-4 transition hover:border-violet-200 dark:hover:border-violet-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={d.status} />
            <span className="text-xs text-gray-400">{timeAgo(d.createdAt)}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">From</div>
          <div className="font-semibold text-sm text-gray-900 dark:text-white">
            {d.donorName}
            {d.donorUser?.username && (
              <Link href={`/u/${d.donorUser.username}`} className="ml-1.5 text-xs text-violet-500 hover:underline">@{d.donorUser.username}</Link>
            )}
          </div>
          {d.message && <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic">&ldquo;{d.message}&rdquo;</p>}
          {d.adminNote && (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold not-italic">Admin note:</span> {d.adminNote}
            </p>
          )}
          {d.status === "FORWARDED" && d.forwardedAt && (
            <p className="mt-1.5 text-xs text-green-600 dark:text-green-400">✓ Dana diteruskan {timeAgo(d.forwardedAt)}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-extrabold text-green-600 dark:text-green-400">{formatIDR(d.amount, d.currency)}</div>
          <div className="text-xs font-mono text-gray-400 mt-0.5">#{d.id.slice(-8)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">
        ←
      </button>
      <span className="text-sm text-gray-500">{page} / {totalPages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page >= totalPages} className="rounded-full border border-gray-200 dark:border-gray-700 px-4 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40">
        →
      </button>
    </div>
  );
}

// ─── Sent history tab ──────────────────────────────────────────────────────

function SentHistory() {
  const [items, setItems] = React.useState<DonationSent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  async function load(p: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/donations?page=${p}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems(data.donations || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(p);
      }
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(1); }, []);

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading...</div>;

  return (
    <div className="space-y-3">
      {total > 0 && <p className="text-xs text-gray-400">{total} donasi dikirim</p>}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
          <p className="text-3xl mb-3">💸</p>
          <p className="font-semibold text-gray-700 dark:text-gray-300">Belum ada donasi yang dikirim</p>
          <p className="mt-1 text-xs text-gray-400">Donasi ke kreator favoritmu!</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((d) => <SentCard key={d.id} d={d} />)}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}

// ─── Received history tab ──────────────────────────────────────────────────

function ReceivedHistory() {
  const [items, setItems] = React.useState<DonationReceived[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [total, setTotal] = React.useState(0);

  async function load(p: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/donations/received?page=${p}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems(data.donations || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(p);
      }
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(1); }, []);

  const forwarded = items.filter((d) => d.status === "FORWARDED");
  const totalForwarded = forwarded.reduce((s, d) => s + d.amount, 0);

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading...</div>;

  return (
    <div className="space-y-3">
      {total > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 px-4 py-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Total diterima </span>
            <span className="font-bold text-gray-900 dark:text-white">{total}</span>
          </div>
          {totalForwarded > 0 && (
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 px-4 py-2 text-sm">
              <span className="text-green-700 dark:text-green-400">Sudah diteruskan </span>
              <span className="font-bold text-green-700 dark:text-green-400">{formatIDR(totalForwarded)}</span>
            </div>
          )}
        </div>
      )}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center">
          <p className="text-3xl mb-3">🎁</p>
          <p className="font-semibold text-gray-700 dark:text-gray-300">Belum ada donasi yang diterima</p>
          <p className="mt-1 text-xs text-gray-400">Terus berkarya dan para pembaca akan mendukungmu!</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((d) => <ReceivedCard key={d.id} d={d} />)}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "settings", label: "Rekening", icon: "🏦" },
  { id: "sent",     label: "Terkirim",  icon: "💸" },
  { id: "received", label: "Diterima",  icon: "🎁" },
];

export default function FinancesPage() {
  const [tab, setTab] = React.useState<Tab>("settings");

  return (
    <main className="min-h-[calc(100vh-96px)] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link href="/home" className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 mb-3 inline-block">← Back</Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Keuangan</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Kelola rekening payout dan pantau riwayat donasi.</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-2xl bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "settings"  && <PayoutForm />}
        {tab === "sent"      && <SentHistory />}
        {tab === "received"  && <ReceivedHistory />}
      </div>
    </main>
  );
}
