"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";

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
      onClick={toggle}
      disabled={isPending}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2 text-sm font-semibold transition disabled:opacity-60 ${
        bookmarked
          ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-200"
          : "border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
      } ${className}`.trim()}
      aria-label="Bookmark"
    >
      <Bookmark size={18} className={bookmarked ? "fill-current" : ""} />
      <span className="whitespace-nowrap">Bookmark</span>
    </button>
  );
}
