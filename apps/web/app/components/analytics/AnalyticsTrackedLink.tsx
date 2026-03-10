"use client";

import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { sendAnalyticsEvent } from "@/lib/analyticsClient";

type Props = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
    analyticsEvent?: Record<string, unknown> | null;
  };

export default function AnalyticsTrackedLink({ analyticsEvent, onClick, children, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        if (analyticsEvent?.eventType) {
          sendAnalyticsEvent(analyticsEvent as any);
        }
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
