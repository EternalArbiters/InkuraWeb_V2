"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

function CircleButton({
  children,
  onClick,
  href,
  ariaLabel,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  ariaLabel: string;
  className?: string;
}) {
  const base =
    "h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg ring-1 ring-white/10 " +
    "transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400";

  const inner = (
    <span className="grid h-full w-full place-items-center text-white">{children}</span>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={`${base} ${className}`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={`${base} ${className}`}
    >
      {inner}
    </button>
  );
}

function ArrowUpIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 5l-7 7m7-7l7 7M12 5v14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeartChatIcon() {
  // Heart + chat bubble look
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 21s-7-4.35-9.33-8.4C.8 9.2 2.55 6 6.08 6c1.87 0 3.13 1.03 3.92 2.1C10.79 7.03 12.05 6 13.92 6c3.53 0 5.28 3.2 3.41 6.6C19 16.65 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.4 13.2h5.2M9.4 15.4h3.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function FloatingActions() {
  const pathname = usePathname();

  const isReader = useMemo(() => {
    // Covers both legacy and new readers
    if (!pathname) return false;
    return pathname.includes("/read/") || pathname.startsWith("/read/");
  }, [pathname]);

  const showChat = useMemo(() => {
    if (!pathname) return true;
    if (pathname.startsWith("/admin")) return false;
    if (pathname.startsWith("/auth")) return false;
    if (pathname === "/chat") return false;
    return true;
  }, [pathname]);

  const opacityClass = isReader ? "opacity-45 hover:opacity-80" : "opacity-95 hover:opacity-100";

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
      {/* Scroll to top (all devices) */}
      <CircleButton
        ariaLabel="Scroll to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={opacityClass}
      >
        <ArrowUpIcon />
      </CircleButton>

      {/* Desktop only: Chat Elya */}
      {showChat && (
        <div className="hidden md:block">
          <CircleButton
            ariaLabel="Chat Elya"
            href="/chat"
            className={opacityClass}
          >
            <HeartChatIcon />
          </CircleButton>
        </div>
      )}
    </div>
  );
}
