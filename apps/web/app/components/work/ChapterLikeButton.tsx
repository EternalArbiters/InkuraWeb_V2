"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";

export default function ChapterLikeButton({
  chapterId,
  initialLiked,
  initialCount,
  className = "",
  variant = "pill",
}: {
  chapterId: string;
  initialLiked: boolean;
  initialCount: number;
  className?: string;
  variant?: "pill" | "icon";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  const toggle = () => {
    startTransition(async () => {
      const res = await fetch(`/api/chapters/${chapterId}/like`, { method: "POST" });
      if (res.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) return;
      setLiked(!!data.liked);
      if (typeof data.likeCount === "number") setCount(data.likeCount);
      router.refresh();
    });
  };

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        disabled={isPending}
        className={`inline-flex items-center justify-center w-11 h-11 rounded-full border transition disabled:opacity-60 ${
          liked
            ? "border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950/30 dark:text-pink-200"
            : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        } ${className}`}
        aria-label={liked ? `Unlike (${count})` : `Like (${count})`}
        title={liked ? `Liked • ${count}` : `Like • ${count}`}
      >
        <span className="relative inline-flex items-center justify-center">
          <Heart size={18} className={liked ? "fill-current" : ""} />
          <span className="absolute -bottom-2 -right-3 text-[10px] font-bold opacity-80">{count}</span>
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold border transition disabled:opacity-60 ${
        liked
          ? "border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950/30 dark:text-pink-200"
          : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      } ${className}`}
      aria-label="Like chapter"
    >
      <Heart size={18} className={liked ? "fill-current" : ""} />
      <span>Like</span>
      <span className="text-xs opacity-70">{count}</span>
    </button>
  );
}
