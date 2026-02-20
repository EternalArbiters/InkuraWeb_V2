"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";

export default function FollowAuthorButton({
  authorId,
  initialFollowing,
  authorName,
}: {
  authorId: string;
  initialFollowing: boolean;
  authorName: string;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);

  if (!session?.user?.id) {
    return (
      <Link
        href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`}
        className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Follow {authorName}
      </Link>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={() => {
        setError(null);
        startTransition(async () => {
          const prev = following;
          setFollowing(!prev);
          try {
            const res = await fetch(`/api/users/${authorId}/follow`, { method: "POST" });
            const data = await res.json().catch(() => ({} as any));
            if (!res.ok) {
              setFollowing(prev);
              setError(data?.error || "Gagal follow");
              return;
            }
            setFollowing(!!data?.following);
          } catch {
            setFollowing(prev);
            setError("Gagal follow");
          }
        });
      }}
      className={
        following
          ? "rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          : "rounded-full px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
      }
      title={error || ""}
    >
      {following ? "Following" : `Follow ${authorName}`}
    </button>
  );
}
