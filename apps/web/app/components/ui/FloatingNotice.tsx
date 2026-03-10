"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export default function FloatingNotice({
  open,
  title = "Error",
  message,
  onClose,
  actionHref,
  actionLabel,
  className,
}: Props) {
  if (!open) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-4 z-[120] md:inset-x-auto md:right-4 md:w-full md:max-w-md">
      <div
        role="alert"
        aria-live="polite"
        className={cn(
          "pointer-events-auto overflow-hidden rounded-2xl border border-red-200/80 bg-white/95 shadow-2xl ring-1 ring-black/5 backdrop-blur dark:border-red-900/70 dark:bg-gray-950/95",
          className
        )}
      >
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-950/70 dark:text-red-300">
            <AlertCircle className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{title}</div>
            <div className="mt-1 text-sm leading-6 text-gray-700 dark:text-gray-200">{message}</div>
            {actionHref && actionLabel ? (
              <div className="mt-3">
                <Link
                  href={actionHref}
                  className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                >
                  {actionLabel}
                </Link>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
