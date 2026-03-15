"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

import Link from "next/link";
import { useState, useTransition } from "react";
import { dispatchNavBadgeRefresh } from "@/app/components/navBadgeEvents";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsClient({ initial }: { initial: NotificationItem[] }) {
  const t = useUILanguageText();
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const markAll = () => {
    startTransition(async () => {
      await fetch(`/api/notifications`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      }).catch(() => null);
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      dispatchNavBadgeRefresh("/api/notifications/unread-count");
    });
  };

  const markOne = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    fetch(`/api/notifications`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    dispatchNavBadgeRefresh("/api/notifications/unread-count");
  };

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {items.filter((n) => !n.isRead).length} unread
        </div>
        <button
          disabled={isPending}
          onClick={markAll}
          className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-60"
        >
          {t("Mark all read")}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
          <div className="text-lg font-bold">No notification yet</div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 transition ${n.isRead
                ? "border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/40"
                : "border-purple-200 dark:border-purple-900 bg-purple-50/60 dark:bg-purple-950/30"
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={"text-sm font-bold " + (n.isRead ? "text-gray-700 dark:text-gray-200 opacity-70" : "")}>{n.title}</div>
                  {n.body ? <div className={"mt-1 text-sm line-clamp-2 " + (n.isRead ? "text-gray-600 dark:text-gray-300" : "text-gray-700 dark:text-gray-200")}>{n.body}</div> : null}
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
                {!n.isRead ? (
                  <button
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                    onClick={() => markOne(n.id)}
                  >
                    Mark read
                  </button>
                ) : null}
              </div>

              <div className="mt-3">
                <Link
                  href={n.href}
                  onClick={() => markOne(n.id)}
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
