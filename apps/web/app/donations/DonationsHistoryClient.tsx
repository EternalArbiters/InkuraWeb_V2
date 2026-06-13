"use client";

import * as React from "react";
import Link from "next/link";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

type SentDonation = {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  message: string | null;
  status: "PENDING" | "VERIFIED" | "FORWARDED" | "REJECTED";
  adminNote: string | null;
  forwardedAt: string | null;
  createdAt: string;
  recipientUser: { id: string; username: string | null; name: string | null };
};

type ReceivedDonation = {
  id: string;
  donorName: string;
  amount: number;
  currency: string;
  message: string | null;
  status: "PENDING" | "VERIFIED" | "FORWARDED" | "REJECTED";
  adminNote: string | null;
  forwardedAt: string | null;
  createdAt: string;
  donorUser: { id: string; username: string | null; name: string | null } | null;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  VERIFIED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  FORWARDED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  FORWARDED: "Forwarded",
  REJECTED: "Rejected",
};

function formatIDR(amount: number, currency = "IDR") {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function displayName(u: { username: string | null; name: string | null } | null) {
  if (!u) return null;
  return (u.name && u.name.trim()) || (u.username && u.username.trim()) || null;
}

function SentDonationCard({ donation, t }: { donation: SentDonation; t: (s: string) => string }) {
  const recipientDisplay =
    displayName(donation.recipientUser) || donation.recipientUser.username || "Unknown";

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[donation.status]}`}>
              {t(STATUS_LABELS[donation.status] || donation.status)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(donation.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t("To")}: </span>
            <Link
              href={`/u/${donation.recipientUser.username}`}
              className="font-semibold hover:text-violet-600 dark:hover:text-purple-300"
            >
              {recipientDisplay}
            </Link>
          </div>
          <div className="mt-0.5 text-sm font-bold text-green-700 dark:text-green-400">
            {formatIDR(donation.amount, donation.currency)}
          </div>
          {donation.message && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
              &ldquo;{donation.message}&rdquo;
            </div>
          )}
          {donation.adminNote && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t("Admin note")}: {donation.adminNote}
            </div>
          )}
          {donation.status === "FORWARDED" && donation.forwardedAt && (
            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
              {t("Forwarded at")} {new Date(donation.forwardedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReceivedDonationCard({ donation, t }: { donation: ReceivedDonation; t: (s: string) => string }) {
  const donorDisplay = displayName(donation.donorUser);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[donation.status]}`}>
              {t(STATUS_LABELS[donation.status] || donation.status)}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {new Date(donation.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">{t("From")}: </span>
            <span className="font-semibold">{donation.donorName}</span>
            {donorDisplay && donorDisplay !== donation.donorName && (
              <span className="ml-1 text-gray-400">({donorDisplay})</span>
            )}
            {donation.donorUser?.username && (
              <Link
                href={`/u/${donation.donorUser.username}`}
                className="ml-1 text-xs text-violet-600 hover:underline dark:text-purple-300"
              >
                @{donation.donorUser.username}
              </Link>
            )}
          </div>
          <div className="mt-0.5 text-sm font-bold text-green-700 dark:text-green-400">
            {formatIDR(donation.amount, donation.currency)}
          </div>
          {donation.message && (
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
              &ldquo;{donation.message}&rdquo;
            </div>
          )}
          {donation.status === "FORWARDED" && donation.forwardedAt && (
            <div className="mt-1 text-xs text-green-600 dark:text-green-400">
              {t("Funds forwarded")} · {new Date(donation.forwardedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type Tab = "sent" | "received";

export default function DonationsHistoryClient({
  initialSent,
  sentTotal,
  sentTotalPages,
  initialReceived,
  receivedTotal,
  receivedTotalPages,
}: {
  initialSent: SentDonation[];
  sentTotal: number;
  sentTotalPages: number;
  initialReceived: ReceivedDonation[];
  receivedTotal: number;
  receivedTotalPages: number;
}) {
  const t = useUILanguageText();
  const [tab, setTab] = React.useState<Tab>("sent");

  const [sentItems, setSentItems] = React.useState(initialSent);
  const [sentPage, setSentPage] = React.useState(1);
  const [sentPages, setSentPages] = React.useState(sentTotalPages);
  const [sentLoading, setSentLoading] = React.useState(false);

  const [receivedItems, setReceivedItems] = React.useState(initialReceived);
  const [receivedPage, setReceivedPage] = React.useState(1);
  const [receivedPages, setReceivedPages] = React.useState(receivedTotalPages);
  const [receivedLoading, setReceivedLoading] = React.useState(false);

  async function loadSent(page: number) {
    setSentLoading(true);
    try {
      const res = await fetch(`/api/donations?page=${page}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSentItems(data.donations || []);
        setSentPage(page);
        setSentPages(data.totalPages || 1);
      }
    } finally {
      setSentLoading(false);
    }
  }

  async function loadReceived(page: number) {
    setReceivedLoading(true);
    try {
      const res = await fetch(`/api/donations/received?page=${page}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setReceivedItems(data.donations || []);
        setReceivedPage(page);
        setReceivedPages(data.totalPages || 1);
      }
    } finally {
      setReceivedLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {/* Tabs */}
      <div className="flex gap-3 border-b border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setTab("sent")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "sent"
              ? "border-violet-600 text-violet-600 dark:border-purple-400 dark:text-purple-400"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {t("Donations Sent")} {sentTotal > 0 ? <span className="ml-1 text-xs">({sentTotal})</span> : null}
        </button>
        <button
          type="button"
          onClick={() => setTab("received")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            tab === "received"
              ? "border-violet-600 text-violet-600 dark:border-purple-400 dark:text-purple-400"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          }`}
        >
          {t("Donations Received")} {receivedTotal > 0 ? <span className="ml-1 text-xs">({receivedTotal})</span> : null}
        </button>
      </div>

      {/* Sent tab */}
      {tab === "sent" && (
        <div className="mt-4">
          {sentLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">{t("Loading...")}</div>
          ) : sentItems.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("No donations sent yet.")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentItems.map((d) => (
                <SentDonationCard key={d.id} donation={d} t={t} />
              ))}
            </div>
          )}
          {sentPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => loadSent(sentPage - 1)}
                disabled={sentPage <= 1 || sentLoading}
                className="rounded-full border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
              >
                {t("Previous")}
              </button>
              <span className="text-sm text-gray-500">{sentPage} / {sentPages}</span>
              <button
                type="button"
                onClick={() => loadSent(sentPage + 1)}
                disabled={sentPage >= sentPages || sentLoading}
                className="rounded-full border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
              >
                {t("Next")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Received tab */}
      {tab === "received" && (
        <div className="mt-4">
          {receivedLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">{t("Loading...")}</div>
          ) : receivedItems.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t("No donations received yet.")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedItems.map((d) => (
                <ReceivedDonationCard key={d.id} donation={d} t={t} />
              ))}
            </div>
          )}
          {receivedPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => loadReceived(receivedPage - 1)}
                disabled={receivedPage <= 1 || receivedLoading}
                className="rounded-full border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
              >
                {t("Previous")}
              </button>
              <span className="text-sm text-gray-500">{receivedPage} / {receivedPages}</span>
              <button
                type="button"
                onClick={() => loadReceived(receivedPage + 1)}
                disabled={receivedPage >= receivedPages || receivedLoading}
                className="rounded-full border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
              >
                {t("Next")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
