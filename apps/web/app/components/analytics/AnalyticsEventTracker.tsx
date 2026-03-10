"use client";

import { useEffect, useMemo, useRef } from "react";
import { sendAnalyticsEvent } from "@/lib/analyticsClient";

type Props = {
  eventType: string;
  payload?: Record<string, unknown>;
  onceKey?: string;
};

export default function AnalyticsEventTracker({ eventType, payload, onceKey }: Props) {
  const sentRef = useRef(false);
  const serializedPayload = useMemo(() => JSON.stringify(payload || {}), [payload]);
  const stablePayload = useMemo(() => (serializedPayload ? (JSON.parse(serializedPayload) as Record<string, unknown>) : {}), [serializedPayload]);

  useEffect(() => {
    if (sentRef.current) return;
    if (onceKey && typeof window !== "undefined") {
      const storageKey = `inkura.analytics.once:${onceKey}`;
      if (window.sessionStorage.getItem(storageKey)) {
        sentRef.current = true;
        return;
      }
      window.sessionStorage.setItem(storageKey, "1");
    }

    sendAnalyticsEvent({ eventType, ...stablePayload });
    sentRef.current = true;
  }, [eventType, onceKey, stablePayload]);

  return null;
}
