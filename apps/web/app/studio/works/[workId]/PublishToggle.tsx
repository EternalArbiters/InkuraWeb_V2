"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function PublishToggle({
  workId,
  status,
}: {
  workId: string;
  status: "DRAFT" | "PUBLISHED";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const nextStatus = status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

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

        router.refresh();
      } catch (e) {
        console.error(e);
        setError("Gagal update status");
      }
    });
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={onClick}
        disabled={isPending}
        className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${
          status === "PUBLISHED"
            ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
            : "border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200"
        } disabled:opacity-60`}
      >
        {isPending
          ? "Updating..."
          : status === "PUBLISHED"
          ? "Set Draft"
          : "Publish"}
      </button>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
