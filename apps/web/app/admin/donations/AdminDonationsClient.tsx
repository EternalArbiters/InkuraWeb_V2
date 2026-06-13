"use client";

import * as React from "react";
import Link from "next/link";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

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

const STATUS_TAB_VALUES = ["", "PENDING", "VERIFIED", "FORWARDED", "REJECTED"] as const;
type StatusTabValue = (typeof STATUS_TAB_VALUES)[number];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  VERIFIED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  FORWARDED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  "": "All", PENDING: "Pending", VERIFIED: "Verified", FORWARDED: "Forwarded", REJECTED: "Rejected",
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
  const t = useUILanguageText();
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
      if (!res.ok) throw new Error((data as any)?.error || t("Failed to update."));
      onUpdated({ ...donation, status: newStatus as any, adminNote: noteInput.trim() || null });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Failed to update."));
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
            alt={t("Transfer proof")}
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
                {t(STATUS_LABEL_KEYS[donation.status] ?? donation.status)}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(donation.createdAt).toLocaleString()}
              </span>
            </div>

            <div className="mt-3 grid gap-1 text-sm">
              <div>
                <span className="font-semibold text-gray-500 dark:text-gray-400">{t("To")}: </span>
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
                <span className="font-semibold text-gray-500 dark:text-gray-400">{t("From")}: </span>
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
                  <span className="font-semibold text-gray-500 dark:text-gray-400">{t("Message")}: </span>
                  <span className="italic text-gray-700 dark:text-gray-200">{donation.message}</span>
                </div>
              )}
              {donation.adminNote && (
                <div>
                  <span className="font-semibold text-gray-500 dark:text-gray-400">{t("Admin note")}: </span>
                  <span className="text-gray-700 dark:text-gray-200">{donation.adminNote}</span>
                </div>
              )}
              {donation.forwardedAt && (
                <div className="text-xs text-gray-500">
                  {t("Forwarded at")}: {new Date(donation.forwardedAt).toLocaleString()}
                </div>
              )}
            </div>

            {payoutInfo ? (
              <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs dark:border-violet-800 dark:bg-violet-900/20">
                <p className="mb-1.5 font-bold text-violet-700 dark:text-violet-300">{t("Send to creator:")}</p>
                <div className="space-y-0.5 text-gray-700 dark:text-gray-200">
                  <p><span className="font-semibold text-gray-500 dark:text-gray-400">{t("Bank / E-wallet")}: </span>{payoutInfo.bankName}</p>
                  <p><span className="font-semibold text-gray-500 dark:text-gray-400">{t("Account No.")}: </span>{payoutInfo.accountNumber}</p>
                  <p><span className="font-semibold text-gray-500 dark:text-gray-400">{t("Account holder name")}: </span>{payoutInfo.holderName}</p>
                  {payoutInfo.notes && <p><span className="font-semibold text-gray-500 dark:text-gray-400">{t("Notes")}: </span>{payoutInfo.notes}</p>}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">{t("No creator has set up payout info yet.")}</p>
            )}

          </div>

          {donation.proofImageUrl && (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 hover:border-violet-400"
              title={t("Transfer proof")}
            >
              <img
                src={donation.proofImageUrl}
                alt={t("Transfer proof")}
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
              placeholder={`${t("Admin note")} (${t("optional")})`}
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
                    {actionPending ? t("Saving...") : t("Mark Verified")}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus("REJECTED")}
                    disabled={actionPending}
                    className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    {t("Reject")}
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
                    {actionPending ? t("Saving...") : t("Mark Forwarded")}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus("REJECTED")}
                    disabled={actionPending}
                    className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    {t("Reject")}
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
  image: string | null;
  payoutInfoJson: string | null;
};

function UserAvatar({ user, size = 36 }: { user: PayoutUser; size?: number }) {
  const dname = user.name?.trim() || user.username?.trim() || "?";
  const initial = dname[0]?.toUpperCase() ?? "?";
  if (user.image) {
    return (
      <img
        src={user.image}
        alt={dname}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center font-bold text-white shrink-0"
    >
      {initial}
    </div>
  );
}

function PayoutListModal({ onClose }: { onClose: () => void }) {
  const t = useUILanguageText();
  const [users, setUsers] = React.useState<PayoutUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

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

  const filtered = query.trim()
    ? users.filter((u) => {
        const q = query.toLowerCase();
        return (
          u.name?.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q)
        );
      })
    : users;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold">{t("Creator Bank Accounts")}</h2>
            {!loading && (
              <p className="text-xs text-gray-400 mt-0.5">{users.length} {t("creators")}</p>
            )}
          </div>
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

        {!loading && users.length > 0 && (
          <div className="px-5 pt-3 pb-2 shrink-0">
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Search creator...")}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="overflow-y-auto px-5 py-3 space-y-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-gray-500">{t("Loading...")}</p>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              {query
                ? `${t("No results for")} "${query}"`
                : t("No creator has set up payout info yet.")}
            </p>
          ) : (
            filtered.map((u) => {
              const info = parsePayoutInfo(u.payoutInfoJson);
              if (!info) return null;
              const dname = u.name?.trim() || u.username?.trim() || "Unknown";
              return (
                <div key={u.id} className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar user={u} size={36} />
                    <div className="min-w-0">
                      <span className="font-semibold text-sm block truncate">{dname}</span>
                      {u.username && (
                        <span className="text-xs text-gray-400">@{u.username}</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-400 text-xs">{t("Bank / E-wallet")}</span>
                      <span className="font-semibold">{info.bankName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-400 text-xs">{t("Account No.")}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold">{info.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() => copyText(info.accountNumber, `${u.id}-acc`)}
                          className="rounded-lg px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-gray-600 dark:text-gray-300 transition-colors"
                        >
                          {copied === `${u.id}-acc` ? t("Copied!") : t("Copy")}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-gray-400 text-xs">{t("Account holder name")}</span>
                      <span className="font-semibold">{info.holderName}</span>
                    </div>
                    {info.notes && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-400 text-xs">{t("Notes")}</span>
                        <span className="text-gray-600 dark:text-gray-300 text-xs">{info.notes}</span>
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
  const t = useUILanguageText();
  const [activeTab, setActiveTab] = React.useState<StatusTabValue>("");
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

  function handleTabChange(value: StatusTabValue) {
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
        <div className="flex flex-wrap gap-2">
          {STATUS_TAB_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleTabChange(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeTab === value
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {t(STATUS_LABEL_KEYS[value]!)}
            </button>
          ))}
          <span className="self-center text-sm text-gray-500">{total} total</span>
        </div>

        <button
          type="button"
          onClick={() => setShowPayouts(true)}
          className="rounded-full border border-violet-300 dark:border-violet-700 px-4 py-1.5 text-sm font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
        >
          {t("Creator Accounts")}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">{t("Loading...")}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
          <div className="text-lg font-bold">{t("No donations found")}</div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t("No donations have been submitted yet.")}
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
            {t("Previous")}
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => fetchDonations(activeTab, page + 1)}
            disabled={page >= totalPages || loading}
            className="rounded-full border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
          >
            {t("Next")}
          </button>
        </div>
      )}
    </div>
  );
}
