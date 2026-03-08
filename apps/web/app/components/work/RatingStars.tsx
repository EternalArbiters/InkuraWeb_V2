"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { readWorkInteraction, seedWorkInteraction, subscribeWorkInteraction, updateWorkInteraction } from "@/lib/workInteractionStore";

type Props = {
  workId: string;
  initialMyRating: number | null;
  ratingAvg: number;
  ratingCount: number;
  className?: string;
};

export default function RatingStars({
  workId,
  initialMyRating,
  ratingAvg,
  ratingCount,
  className = "",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [myRating, setMyRating] = useState<number | null>(initialMyRating);
  const [avg, setAvg] = useState<number>(ratingAvg);
  const [count, setCount] = useState<number>(ratingCount);

  useEffect(() => {
    seedWorkInteraction(workId, { myRating: initialMyRating, ratingAvg, ratingCount });
    const sync = () => {
      const state = readWorkInteraction(workId);
      setMyRating(state.myRating ?? initialMyRating);
      setAvg(state.ratingAvg ?? ratingAvg);
      setCount(state.ratingCount ?? ratingCount);
    };
    sync();
    return subscribeWorkInteraction(workId, sync);
  }, [initialMyRating, ratingAvg, ratingCount, workId]);

  const avgLabel = useMemo(() => {
    if (!count) return "0.0";
    return (Math.round(avg * 10) / 10).toFixed(1);
  }, [avg, count]);

  const setRating = (value: number) => {
    startTransition(async () => {
      const res = await fetch(`/api/works/${workId}/rate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ value }),
      });
      if (res.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) return;
      updateWorkInteraction(workId, (current) => ({
        ...current,
        myRating: typeof data.myRating === "number" ? data.myRating : current.myRating ?? initialMyRating,
        ratingAvg: typeof data.ratingAvg === "number" ? data.ratingAvg : current.ratingAvg ?? ratingAvg,
        ratingCount: typeof data.ratingCount === "number" ? data.ratingCount : current.ratingCount ?? ratingCount,
      }));
    });
  };

  return (
    <div className={`inline-flex min-w-0 items-center justify-between gap-1.5 rounded-full border border-gray-300 bg-white/70 px-3 py-2 text-sm font-semibold leading-none dark:border-gray-700 dark:bg-gray-950/30 sm:gap-2 sm:px-5 ${className}`.trim()}>
      <div className="flex min-w-0 items-center gap-0.5 sm:gap-1">
        {[1, 2, 3, 4, 5].map((v) => {
          const active = (myRating ?? 0) >= v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setRating(v)}
              disabled={isPending}
              className={`shrink-0 rounded p-0.5 ${active ? "text-yellow-600 dark:text-yellow-300" : "text-gray-400 dark:text-gray-500"} hover:brightness-110 disabled:opacity-60`}
              aria-label={`Rate ${v}`}
            >
              <Star size={18} className={`h-4 w-4 shrink-0 sm:h-5 sm:w-5 ${active ? "fill-current" : ""}`.trim()} />
            </button>
          );
        })}
      </div>

      <div className="shrink-0 whitespace-nowrap text-xs text-gray-700 dark:text-gray-200 sm:text-sm">
        <span className="font-bold">{avgLabel}</span>
        <span className="opacity-70"> ({count})</span>
      </div>
    </div>
  );
}
