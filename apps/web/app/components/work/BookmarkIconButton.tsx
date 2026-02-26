"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";

export default function BookmarkIconButton({
  workId,
  initialBookmarked,
  className = "",
}: {
  workId: string;
  initialBookmarked: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  useEffect(() => {
    setBookmarked(initialBookmarked);
  }, [initialBookmarked]);

  const toggle = () => {
    startTransition(async () => {
      const res = await fetch(`/api/works/${workId}/bookmark`, { method: "POST" });
      if (res.status === 401) {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) return;
      setBookmarked(!!data.bookmarked);
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full border transition disabled:opacity-60 ${
        bookmarked
          ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-200"
          : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      } ${className}`}
      aria-label={bookmarked ? "Bookmarked" : "Bookmark"}
      title={bookmarked ? "Saved" : "Save"}
    >
      <Bookmark size={18} className={bookmarked ? "fill-current" : ""} />
    </button>
  );
}
