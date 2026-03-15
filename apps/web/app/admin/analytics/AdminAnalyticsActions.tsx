"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

type Props = {
  start: string;
  end: string;
  days: number;
  limit: number;
  hasCustomRange: boolean;
};

function buildQuery(args: { start?: string; end?: string; days?: number; limit?: number; hasCustomRange?: boolean }) {
  const params = new URLSearchParams();
  if (args.hasCustomRange) {
    if (args.start) params.set("start", args.start);
    if (args.end) params.set("end", args.end);
  } else if (args.days) {
    params.set("days", String(args.days));
  }
  if (args.limit) params.set("limit", String(args.limit));
  return params.toString();
}

export default function AdminAnalyticsActions({ start, end, days, limit, hasCustomRange }: Props) {
  const t = useUILanguageText();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const exportHref = useMemo(() => {
    const query = buildQuery({ start, end, days, limit, hasCustomRange });
    return `/api/admin/analytics/export${query ? `?${query}` : ""}`;
  }, [start, end, days, limit, hasCustomRange]);

  async function handleRebuild() {
    setMessage(null);
    startTransition(async () => {
      try {
        const payload = hasCustomRange ? { start, end } : { days };
        const response = await fetch("/api/admin/analytics/rebuild", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || data?.message || t("Failed to rebuild analytics"));
        setMessage(`${t("Aggregate rebuilt for")} ${data?.count || 0} ${t("day(s).")}`);
        router.refresh();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : t("Failed to rebuild analytics"));
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={exportHref}
          className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
        >
          Download PDF
        </a>
        <button
          type="button"
          onClick={handleRebuild}
          disabled={isPending}
          className="rounded-full border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-950/60"
        >
          {isPending ? t("Rebuilding...") : t("Rebuild aggregates")}
        </button>
      </div>
      {message ? <div className="text-right text-xs text-gray-500 dark:text-gray-400">{message}</div> : null}
    </div>
  );
}
