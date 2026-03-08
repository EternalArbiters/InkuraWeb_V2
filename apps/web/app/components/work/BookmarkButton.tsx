"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { readWorkInteraction, seedWorkInteraction, subscribeWorkInteraction, updateWorkInteraction } from "@/lib/workInteractionStore";

type Props = {
  workId: string;
  initialBookmarked: boolean;
  className?: string;
};

export default function BookmarkButton({ workId, initialBookmarked, className = "" }: Props) {
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

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold leading-none transition disabled:opacity-60 ${
        bookmarked
          ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-200"
          : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      } ${className}`.trim()}
      aria-label="Bookmark"
    >
      <Bookmark size={20} className={`h-5 w-5 shrink-0 ${bookmarked ? "fill-current" : ""}`.trim()} />
      <span className="whitespace-nowrap">Bookmark</span>
    </button>
  );
}
