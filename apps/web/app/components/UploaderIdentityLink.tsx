"use client";

import Link from "next/link";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

type UserLite = {
  username?: string | null;
  name?: string | null;
  image?: string | null;
};

function rawDisplayName(user?: UserLite | null) {
  return user?.name?.trim() || user?.username?.trim() || "Unknown";
}

function initials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
  return (parts.map((part) => part[0]).join("") || "U").toUpperCase();
}

export default function UploaderIdentityLink({
  user,
  className = "",
  avatarClassName = "h-6 w-6",
  textClassName = "text-xs text-gray-600 dark:text-gray-300",
}: {
  user?: UserLite | null;
  className?: string;
  avatarClassName?: string;
  textClassName?: string;
}) {
  const t = useUILanguageText();
  const label = user?.name?.trim() || user?.username?.trim() || t("Unknown");
  const href = user?.username ? `/u/${user.username}` : null;
  const content = (
    <>
      <span
        className={`relative inline-flex shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800 ${avatarClassName}`}
        aria-hidden="true"
      >
        {user?.image ? (
          <img src={user.image} alt={label} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-gray-700 dark:text-gray-200">
            {initials(rawDisplayName(user))}
          </span>
        )}
      </span>
      <span className={`min-w-0 truncate ${textClassName}`}>{label}</span>
    </>
  );

  if (!href) {
    return <div className={`flex items-center gap-2 min-w-0 ${className}`}>{content}</div>;
  }

  return (
    <Link href={href} className={`flex items-center gap-2 min-w-0 transition hover:opacity-90 ${className}`}>
      {content}
    </Link>
  );
}
