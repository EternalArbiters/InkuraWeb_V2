"use client";

import * as React from "react";
import { MoreVertical } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  userId: string;
  username: string;
  displayName: string;
  initialBlocked?: boolean;
  requiresAuth?: boolean;
};

function buildAbsoluteProfileUrl(username: string) {
  if (typeof window === "undefined") return `/u/${username}`;
  return new URL(`/u/${username}`, window.location.origin).toString();
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export default function PublicProfileActionsMenu({
  userId,
  username,
  displayName,
  initialBlocked = false,
  requiresAuth = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuRef = React.useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = React.useState(false);
  const [blocked, setBlocked] = React.useState(initialBlocked);
  const [pending, setPending] = React.useState<null | "block" | "report">(null);
  const callbackUrl = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
  const profileUrl = buildAbsoluteProfileUrl(username);

  React.useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const ensureAuth = () => {
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Profile actions"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white/70 text-gray-700 shadow-sm backdrop-blur transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-100 dark:hover:bg-gray-800 sm:h-11 sm:w-11"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-950">
          <button
            type="button"
            disabled={pending !== null}
            onClick={async () => {
              if (requiresAuth) return ensureAuth();
              setPending("block");
              try {
                const res = await fetch(`/api/users/${userId}/block`, { method: "POST" });
                if (res.status === 401) return ensureAuth();
                const payload = await res.json().catch(() => null);
                if (!res.ok || !payload || typeof payload.blocked !== "boolean") {
                  throw new Error("Failed to update block status");
                }
                setBlocked(payload.blocked);
                setOpen(false);
                router.refresh();
              } catch (error) {
                console.error("[profile-menu:block]", error);
              } finally {
                setPending(null);
              }
            }}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            <span>{blocked ? "Buka blokir" : "Blokir"}</span>
            <span className="text-xs text-current/70">{pending === "block" ? "..." : ""}</span>
          </button>

          <button
            type="button"
            disabled={pending !== null}
            onClick={async () => {
              if (requiresAuth) return ensureAuth();
              const reason = window.prompt(`Why do you want to report @${username}?`);
              if (!reason || !reason.trim()) return;
              setPending("report");
              try {
                const res = await fetch("/api/admin-report", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    title: `Profile report: @${username}`,
                    message: `Reported profile: ${displayName} (@${username})\nReason: ${reason.trim()}`,
                    pageUrl: `/u/${username}`,
                  }),
                });
                if (res.status === 401) return ensureAuth();
                if (!res.ok) throw new Error("Failed to submit report");
                setOpen(false);
              } catch (error) {
                console.error("[profile-menu:report]", error);
              } finally {
                setPending(null);
              }
            }}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            <span>Report</span>
            <span className="text-xs text-current/70">{pending === "report" ? "..." : ""}</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              const copied = await copyText(profileUrl);
              if (!copied) window.prompt("Copy profile URL", profileUrl);
              setOpen(false);
            }}
            className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-900"
          >
            Copy URL Profile
          </button>

          <button
            type="button"
            onClick={async () => {
              const nav = navigator as Navigator & { share?: (data: { title?: string; url?: string }) => Promise<void> };
              try {
                if (typeof nav.share === "function") {
                  await nav.share({ title: `${displayName} · Inkura`, url: profileUrl });
                } else {
                  const copied = await copyText(profileUrl);
                  if (!copied) window.prompt("Copy profile URL", profileUrl);
                }
              } catch {
                // ignore canceled share
              } finally {
                setOpen(false);
              }
            }}
            className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-gray-900"
          >
            Share URL Profile
          </button>
        </div>
      ) : null}
    </div>
  );
}
