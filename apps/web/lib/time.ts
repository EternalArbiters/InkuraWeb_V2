export type DateLike = string | Date | null | undefined;

function toDate(v: DateLike): Date | null {
  if (!v) return null;
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? null : d;
}

function plural(n: number, unit: string) {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

/**
 * Returns a label like:
 * - "Updated just now"
 * - "Updated 12 minutes ago"
 * - "Updated 3 hours ago"
 * - "Updated 9 days ago"
 * - "Updated 2026-02-09" (if older than thresholdDays)
 */
export function formatUpdatedAt(
  updatedAt: DateLike,
  opts?: {
    now?: Date;
    thresholdDays?: number;
  }
) {
  const d = toDate(updatedAt);
  if (!d) return "";

  const now = opts?.now ?? new Date();
  const thresholdDays = opts?.thresholdDays ?? 100;

  const diffMs = Math.max(0, now.getTime() - d.getTime());
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays >= thresholdDays) {
    return `Updated ${d.toISOString().slice(0, 10)}`;
  }

  if (diffMinutes < 1) return "Updated just now";
  if (diffHours < 1) return `Updated ${plural(diffMinutes, "minute")} ago`;
  if (diffDays < 1) return `Updated ${plural(diffHours, "hour")} ago`;
  return `Updated ${plural(diffDays, "day")} ago`;
}
