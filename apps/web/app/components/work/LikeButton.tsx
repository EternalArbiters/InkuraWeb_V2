"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";

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
    setLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  const toggle = () => {
    startTransition(async () => {
      const res = await fetch(`/api/works/${workId}/like`, { method: "POST" });
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

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold leading-none transition disabled:opacity-60 ${
        liked
          ? "border-pink-300 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950/30 dark:text-pink-200"
          : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      } ${className}`.trim()}
      aria-label="Favorite"
    >
      <Heart size={20} className={`h-5 w-5 shrink-0 ${liked ? "fill-current" : ""}`.trim()} />
      <span className="whitespace-nowrap">Favorite</span>
      <span className="text-sm opacity-70">{count}</span>
    </button>
  );
}
