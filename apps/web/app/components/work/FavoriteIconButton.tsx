"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { readWorkInteraction, seedWorkInteraction, subscribeWorkInteraction, updateWorkInteraction } from "@/lib/workInteractionStore";

export default function FavoriteIconButton({
  workId,
  initialFavorited,
  className = "",
}: {
  workId: string;
  initialFavorited: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [favorited, setFavorited] = useState(initialFavorited);

  useEffect(() => {
    seedWorkInteraction(workId, { liked: initialFavorited });
    const sync = () => {
      const state = readWorkInteraction(workId);
      setFavorited(state.liked ?? initialFavorited);
    };
    sync();
    return subscribeWorkInteraction(workId, sync);
  }, [initialFavorited, workId]);

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
        likeCount: typeof data.likeCount === "number" ? data.likeCount : current.likeCount,
      }));
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full border transition disabled:opacity-60 ${
        // v39: `rose`, not `pink` — see the matching note in LikeButton.tsx.
        favorited
          ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-200"
          : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      } ${className}`}
      aria-label={favorited ? "Favorited" : "Favorite"}
      title={favorited ? "Favorited" : "Favorite"}
    >
      <Heart size={18} className={favorited ? "fill-current" : ""} />
    </button>
  );
}
