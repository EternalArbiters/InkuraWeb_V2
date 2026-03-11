"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  userId: string;
  initialFollowing: boolean;
  requiresAuth?: boolean;
  size?: "default" | "small";
};

export default function FollowToggleButton({ userId, initialFollowing, requiresAuth = false, size = "default" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [following, setFollowing] = React.useState(initialFollowing);
  const [pending, startTransition] = React.useTransition();
  const callbackUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
  const sizeClass = size === "small" ? "px-3 py-1.5 text-xs" : "px-5 py-2.5 text-sm";

  if (requiresAuth) {
    return (
      <Link
        href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        className={`inline-flex items-center justify-center rounded-full border border-purple-400/60 ${sizeClass} font-semibold text-purple-200 hover:bg-purple-500/10`}
      >
        Follow
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          try {
            const res = await fetch(`/api/users/${userId}/follow`, { method: "POST" });
            if (res.status === 401) {
              router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
              return;
            }
            const payload = await res.json().catch(() => null);
            if (!res.ok || !payload || typeof payload.following !== "boolean") {
              throw new Error("Failed to update follow status");
            }
            setFollowing(payload.following);
            router.refresh();
          } catch (error) {
            console.error("[follow-toggle]", error);
          }
        });
      }}
      className={[
        "inline-flex items-center justify-center rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        sizeClass,
        following
          ? "border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
          : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110",
      ].join(" ")}
    >
      {pending ? "Loading..." : following ? "Following" : "Follow"}
    </button>
  );
}
