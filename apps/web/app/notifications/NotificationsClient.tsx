"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Bell, Heart, MessageCircle, BookOpen, Star, Megaphone, Trophy } from "lucide-react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
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

function relativeTime(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w`;
  return `${Math.floor(d / 30)}mo`;
}

function NotifIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  let Icon = Bell;
  let from = "from-blue-500";
  let to = "to-purple-600";

  if (t.includes("like") || t.includes("heart") || t.includes("favorite")) {
    Icon = Heart; from = "from-pink-500"; to = "to-rose-500";
  } else if (t.includes("comment") || t.includes("reply")) {
    Icon = MessageCircle; from = "from-sky-500"; to = "to-blue-600";
  } else if (t.includes("chapter") || t.includes("update") || t.includes("new")) {
    Icon = BookOpen; from = "from-emerald-500"; to = "to-green-600";
  } else if (t.includes("rating") || t.includes("review") || t.includes("star")) {
    Icon = Star; from = "from-yellow-400"; to = "to-amber-500";
  } else if (t.includes("rank") || t.includes("badge") || t.includes("award")) {
    Icon = Trophy; from = "from-amber-400"; to = "to-orange-500";
  } else if (t.includes("system") || t.includes("announce") || t.includes("admin")) {
    Icon = Megaphone; from = "from-orange-400"; to = "to-red-500";
  }

  return (
    <div className={`h-11 w-11 shrink-0 rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center shadow-sm`}>
      <Icon className="h-5 w-5 text-white" strokeWidth={2} />
    </div>
  );
}

export default function NotificationsClient({ initial }: { initial: NotificationItem[] }) {
  const t = useUILanguageText();
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const unreadCount = items.filter((n) => !n.isRead).length;

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
    <section className="mt-4">
      <div className="flex items-center justify-between gap-3 pb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {unreadCount > 0 ? `${unreadCount} ${t("unread")}` : t("All caught up")}
        </span>
        {unreadCount > 0 && (
          <button
            disabled={isPending}
            onClick={markAll}
            className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-60"
          >
            {t("Mark all read")}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Bell className="h-7 w-7 text-gray-400" />
          </div>
          <div className="text-base font-semibold text-gray-700 dark:text-gray-200">{t("No notifications yet")}</div>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("You're all caught up!")}</div>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
          {items.map((n) => (
            <Link
              key={n.id}
              href={n.href}
              onClick={() => markOne(n.id)}
              className={`flex items-center gap-3 px-1 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/50 rounded-xl ${
                !n.isRead ? "bg-purple-50/40 dark:bg-purple-950/20" : ""
              }`}
            >
              <NotifIcon type={n.type} />

              <div className="min-w-0 flex-1">
                <p className={`text-sm leading-snug ${!n.isRead ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                  {n.title}
                  <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">
                    {relativeTime(n.createdAt)}
                  </span>
                </p>
                {n.body ? (
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-snug">
                    {n.body}
                  </p>
                ) : null}
              </div>

              {!n.isRead && (
                <div className="shrink-0 h-2.5 w-2.5 rounded-full bg-purple-500" aria-hidden="true" />
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
