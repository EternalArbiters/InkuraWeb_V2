"use client";

import * as React from "react";
import Link from "next/link";

type DonorUser = { id: string; username: string | null; name: string | null } | null;
type PayoutInfo = { bankName: string; accountNumber: string; holderName: string; notes: string } | null;
type RecipientUser = { id: string; username: string | null; name: string | null; payoutInfoJson?: string | null };

type Donation = {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  message: string | null;
  proofImageUrl: string | null;
  status: "PENDING" | "VERIFIED" | "FORWARDED" | "REJECTED";
  adminNote: string | null;
  forwardedAt: string | null;
  createdAt: string;
  donorUser: DonorUser;
  recipientUser: RecipientUser;
};

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Verified", value: "VERIFIED" },
  { label: "Forwarded", value: "FORWARDED" },
  { label: "Rejected", value: "REJECTED" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  VERIFIED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  FORWARDED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

function formatIDR(amount: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function parsePayoutInfo(raw: string | null | undefined): PayoutInfo {
  try {
    const p = JSON.parse(raw || "{}");
    if (!p?.bankName && !p?.accountNumber) return null;
    return {
      bankName: String(p.bankName || ""),
      accountNumber: String(p.accountNumber || ""),
      holderName: String(p.holderName || ""),
      notes: String(p.notes || ""),
    };
  } catch {
    return null;
  }
}

function displayName(u: { username: string | null; name: string | null } | null) {
  if (!u) return null;
  return (u.name && u.name.trim()) || (u.username && u.username.trim()) || null;
}

function DonationCard({ donation, onUpdated }: { donation: Donation; onUpdated: (updated: Donation) => void }) {
  const [noteInput, setNoteInput] = React.useState(donation.adminNote || "");
  const [actionPending, setActionPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [lightbox, setLightbox] = React.useState(false);

  const recipientDisplay = displayName(donation.recipientUser) || donation.recipientUser.username || "Unknown";
  const payoutInfo = parsePayoutInfo(donation.recipientUser.payoutInfoJson);
  const donorUserDisplay = displayName(donation.donorUser);

  async function updateStatus(newStatus: string) {
    setError(null);
    setActionPending(true);
    try {
      const res = await fetch(`/api/admin/donations/creator/${donation.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNote: noteInput.trim() || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.error || "Failed to update status.");
      onUpdated({ ...donation, status: newStatus as any, adminNote: noteInput.trim() || null });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setActionPending(false);
    }
  }

  return (
    <>
      {lightbox && donation.proofImageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={donation.proofImageUrl}
            alt="Transfer proof"
            className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-mono text-gray-400">#{donation.id.slice(-8)}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[donation.status] ?? ""}`}>
                {donation.status}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(donation.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="mt-3 grid gap-1 text-sm">
              <div>
                <span className="font-semibold text-gray-500 dark:text-gray-400">To: </span>
                <Link
                  href={`/u/${donation.recipientUser.username}`}
                  className="font-semibold hover:text-violet-600 dark:hover:text-purple-300"
                  target="_blank"
                >
                  {recipientDisplay}
                  {donation.recipientUser.username ? ` (@${donation.recipientUser.username})` : ""}
                </Link>
              </div>
              <div>
                <span className="font-semibold text-gray-500 dark:text-gray-400">From: </span>
                <span className="font-semibold">{donation.donorName}</span>
                {donorUserDisplay && donorUserDisplay !== donation.donorName && (
                  <span className="ml-1 text-gray-500">({donorUserDisplay})</span>
                )}
                {donation.donorUser?.username && (
                  <Link
                    href={`/u/${donation.donorUser.username}`}
                    className="ml-1 text-xs text-violet-600 hover:underline dark:text-purple-300"
                    target="_blank"
                  >
                    @{donation.donorUser.username}
                  </Link>
                )}
              </div>
              <div>
                <span className="font-semibold text-gray-500 dark:text-gray-400">Amount: </span>
                <span className="text-lg font-bold text-green-700 dark:text-green-400">
                  {formatIDR(donation.amount, donation.currency)}
                </span>
              </div>
              {donation.message && (
                <div>
                  <span className="font-semibold text-gray-500 dark:text-gray-400">Message: </span>
                  <span className="italic text-gray-700 dark:text-gray-200">{donation.message}</span>
                </div>
              )}
              {donation.adminNote && (
                <div>
                  <span className="font-semibold text-gray-500 dark:text-gray-400">Admin note: </span>
                  <span className="text-gray-700 dark:text-gray-200">{donation.adminNote}</span>
                </div>
              )}
              {donation.forwardedAt && (
                <div className="text-xs text-gray-500">
                  Forwarded at: {new Date(donation.forwardedAt).toLocaleString()}
                </div>
              )}
            </div>

            {payoutInfo ? (
              <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs dark:border-violet-800 dark:bg-violet-900/20">
                <p className="mb-1.5 font-bold text-violet-700 dark:text-violet-300">Send to creator:</p>
                <div className="space-y-0.5 text-gray-700 dark:text-gray-200">
                  <p><span className="font-semibold text-gray-500 dark:text-gray-400">Bank/E-wallet: </span>{payoutInfo.bankName}</p>
                  <p><span className="font-semibold text-gray-500 dark:text-gray-400">Account: </span>{payoutInfo.accountNumber}</p>
                  <p><span className="font-semibold text-gray-500 dark:text-gray-400">Holder: </span>{payoutInfo.holderName}</p>
                  {payoutInfo.notes && <p><span className="font-semibold text-gray-500 dark:text-gray-400">Notes: </span>{payoutInfo.notes}</p>}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">Creator has not set up payout info yet.</p>
            )}

          </div>

          {donation.proofImageUrl && (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-400"
              title="View transfer proof"
            >
              <img
                src={donation.proofImageUrl}
                alt="Transfer proof"
                className="h-20 w-20 object-cover"
              />
            </button>
          )}
        </div>

        {(donation.status === "PENDING" || donation.status === "VERIFIED") && (
          <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-3">
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Admin note (optional)"
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              disabled={actionPending}
            />

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {donation.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    onClick={() => updateStatus("VERIFIED")}
                    disabled={actionPending}
                    className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionPending ? "Saving..." : "Mark Verified"}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus("REJECTED")}
                    disabled={actionPending}
                    className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
              {donation.status === "VERIFIED" && (
                <>
                  <button
                    type="button"
                    onClick={() => updateStatus("FORWARDED")}
                    disabled={actionPending}
                    className="rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionPending ? "Saving..." : "Mark Forwarded"}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus("REJECTED")}
                    disabled={actionPending}
                    className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

type PayoutUser = {
  id: string;
  username: string | null;
  name: string | null;
  payoutInfoJson: string | null;
};

function PayoutListModal({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = React.useState<PayoutUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/donations/creator/payouts")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  }, []);

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4">
          <h2 className="text-lg font-bold">Creator Bank Accounts</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">Loading...</p>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No creator has set up payout info yet.</p>
          ) : (
            users.map((u) => {
              const info = parsePayoutInfo(u.payoutInfoJson);
              if (!info) return null;
              const displayName = (u.name?.trim()) || (u.username?.trim()) || "Unknown";
              return (
                <div key={u.id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-semibold text-sm">{displayName}</span>
                    {u.username && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">Bank/E-wallet</span>
                      <span className="font-semibold">{info.bankName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">No. Rekening</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold">{info.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyText(info.accountNumber, `${u.id}-acc`)}
                          className="rounded px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-gray-600 dark:text-gray-300"
                        >
                          {copied === `${u.id}-acc` ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">Nama</span>
                      <span className="font-semibold">{info.holderName}</span>
                    </div>
                    {info.notes && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">Catatan</span>
                        <span className="text-gray-700 dark:text-gray-300">{info.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDonationsClient({
  initial,
  initialTotal,
  initialTotalPages,
}: {
  initial: Donation[];
  initialTotal: number;
  initialTotalPages: number;
}) {
  const [activeTab, setActiveTab] = React.useState("");
  const [items, setItems] = React.useState(initial);
  const [total, setTotal] = React.useState(initialTotal);
  const [totalPages, setTotalPages] = React.useState(initialTotalPages);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [showPayouts, setShowPayouts] = React.useState(false);

  async function fetchDonations(status: string, newPage = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("page", String(newPage));
      const res = await fetch(`/api/admin/donations/creator?${params}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setItems(data.donations || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setPage(newPage);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleTabChange(value: string) {
    setActiveTab(value);
    fetchDonations(value, 1);
  }

  function handleUpdated(updated: Donation) {
    setItems((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  return (
    <div className="mt-6">
      {showPayouts && <PayoutListModal onClose={() => setShowPayouts(false)} />}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => handleTabChange(tab.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeTab === tab.value
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="self-center text-sm text-gray-500">{total} total</span>
        </div>

        <button
          type="button"
          onClick={() => setShowPayouts(true)}
          className="rounded-full border border-violet-300 dark:border-violet-700 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
        >
          Creator Accounts
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
          <div className="text-lg font-bold">No donations found</div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {activeTab ? `No ${activeTab.toLowerCase()} donations.` : "No donations have been submitted yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((d) => (
            <DonationCard key={d.id} donation={d} onUpdated={handleUpdated} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => fetchDonations(activeTab, page - 1)}
            disabled={page <= 1 || loading}
            className="rounded-full border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => fetchDonations(activeTab, page + 1)}
            disabled={page >= totalPages || loading}
            className="rounded-full border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
