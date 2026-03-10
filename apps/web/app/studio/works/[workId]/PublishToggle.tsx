"use client";

import { useEffect, useState, useTransition } from "react";

export default function PublishToggle({
  workId,
  status,
  fullWidth = false,
  onStatusChange,
}: {
  workId: string;
  status: "DRAFT" | "PUBLISHED";
  fullWidth?: boolean;
  onStatusChange?: (status: "DRAFT" | "PUBLISHED") => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState(status);

  useEffect(() => {
    setCurrentStatus(status);
  }, [status]);

  const nextStatus = currentStatus === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/studio/works/${workId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });

        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) {
          setError(data?.error || "Gagal update status");
          return;
        }

        setCurrentStatus(nextStatus);
        onStatusChange?.(nextStatus);
      } catch (e) {
        console.error(e);
        setError("Gagal update status");
      }
    });
  };

  const actionLabel = currentStatus === "PUBLISHED" ? "Set Draft" : "Publish";
  const statusLabel = currentStatus === "PUBLISHED" ? "Status: Published" : "Status: Draft";

  return (
    <div className={`flex flex-col gap-2 ${fullWidth ? "items-stretch" : "items-start"}`}>
      <button
        onClick={onClick}
        disabled={isPending}
        title={`${statusLabel}. Tap to ${actionLabel.toLowerCase()}.`}
        aria-label={`${statusLabel}. Tap to ${actionLabel.toLowerCase()}.`}
        className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${fullWidth ? "w-full text-center" : ""} ${
          currentStatus === "PUBLISHED"
            ? "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
            : "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
        } disabled:opacity-60`}
      >
        {isPending ? "Updating..." : statusLabel}
      </button>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
