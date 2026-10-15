"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { readWorkInteraction, seedWorkInteraction, subscribeWorkInteraction, updateWorkInteraction } from "@/lib/workInteractionStore";

type Props = {
  workId: string;
  initialLiked: boolean;
  initialCount: number;
  className?: string;
};

export default function LikeButton({ workId, initialLiked, initialCount, className = "" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    seedWorkInteraction(workId, { liked: initialLiked, likeCount: initialCount });
    const sync = () => {
      const state = readWorkInteraction(workId);
      setLiked(state.liked ?? initialLiked);
      setCount(state.likeCount ?? initialCount);
    };
    sync();
    return subscribeWorkInteraction(workId, sync);
  }, [initialCount, initialLiked, workId]);

  const toggle = () => {
    startTransition(async () => {
      const res = await fetch(`/api/works/${workId}/like`, { method: "POST" });
      if (res.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) return;
      updateWorkInteraction(workId, (current) => ({
        ...current,
        liked: !!data.liked,
        likeCount: typeof data.likeCount === "number" ? data.likeCount : current.likeCount ?? initialCount,
      }));
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold leading-none transition disabled:opacity-60 ${
        // v39: "liked" state is deliberately `rose`, not `pink` — the whole `pink`
        // Tailwind family was remapped to gold for the brand palette, but a heart
        // turning red when favorited is a semantic convention, not a brand colour,
        // so it's one of the few families (with `rose` itself, the gem-tier badges,
        // the landing icon palette) left out of that remap on purpose.
        liked
          ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
          : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      } ${className}`.trim()}
      aria-label="Like work"
    >
      <Heart size={20} className={`h-5 w-5 shrink-0 ${liked ? "fill-current" : ""}`.trim()} />
      <span className="whitespace-nowrap">Favorite</span>
      <span className="text-xs opacity-70">{count}</span>
    </button>
  );
}
