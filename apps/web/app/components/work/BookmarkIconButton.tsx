"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { readWorkInteraction, seedWorkInteraction, subscribeWorkInteraction, updateWorkInteraction } from "@/lib/workInteractionStore";

type Props = {
  workId: string;
  initialBookmarked: boolean;
  className?: string;
  variant?: "default" | "overlay";
  size?: "sm" | "md";
};

export default function BookmarkIconButton({
  workId,
  initialBookmarked,
  className = "",
  variant = "default",
  size = "md",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  useEffect(() => {
    seedWorkInteraction(workId, { bookmarked: initialBookmarked });
    const sync = () => {
      const state = readWorkInteraction(workId);
      setBookmarked(state.bookmarked ?? initialBookmarked);
    };
    sync();
    return subscribeWorkInteraction(workId, sync);
  }, [initialBookmarked, workId]);

  const toggle = () => {
    startTransition(async () => {
      const res = await fetch(`/api/works/${workId}/bookmark`, { method: "POST" });
      if (res.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) return;
      updateWorkInteraction(workId, (current) => ({ ...current, bookmarked: !!data.bookmarked }));
    });
  };

  const sizeClass = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "sm" ? 13 : 18;

  const toneClass =
    variant === "overlay"
      ? bookmarked
        ? "border border-purple-300/35 bg-purple-500/85 text-white shadow-lg shadow-purple-950/25"
        : "border border-white/10 bg-black/45 text-white backdrop-blur-sm hover:bg-black/60"
      : bookmarked
        ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-200"
        : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center justify-center rounded-full border transition disabled:opacity-60 ${sizeClass} ${toneClass} ${className}`}
      aria-label={bookmarked ? "Bookmarked" : "Bookmark"}
      title={bookmarked ? "Saved" : "Save"}
    >
      <Bookmark size={iconSize} className={bookmarked ? "fill-current" : ""} />
    </button>
  );
}
