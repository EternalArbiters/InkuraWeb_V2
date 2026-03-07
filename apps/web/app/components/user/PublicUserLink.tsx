"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type UserLike = {
  username?: string | null;
  name?: string | null;
};

function labelForUser(user: UserLike | null | undefined, fallback = "Unknown") {
  const name = typeof user?.name === "string" ? user.name.trim() : "";
  if (name) return name;
  const username = typeof user?.username === "string" ? user.username.trim() : "";
  if (username) return username;
  return fallback;
}

export function displayUserLabel(user: UserLike | null | undefined, fallback = "Unknown") {
  return labelForUser(user, fallback);
}

export default function PublicUserLink({
  user,
  className,
  fallback = "Unknown",
  children,
}: {
  user?: UserLike | null;
  className?: string;
  fallback?: string;
  children?: ReactNode;
}) {
  const username = typeof user?.username === "string" ? user.username.trim() : "";
  const label = children ?? labelForUser(user, fallback);

  if (!username) {
    return <span className={className}>{label}</span>;
  }

  return (
    <Link href={`/u/${username}`} className={className}>
      {label}
    </Link>
  );
}
