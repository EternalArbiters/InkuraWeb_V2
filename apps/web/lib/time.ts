export type DateLike = string | Date | null | undefined;

function toDate(v: DateLike): Date | null {
  if (!v) return null;
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? null : d;
}

export type TimeLocale = {
  justNow: string;
  minutesAgo: (n: number) => string;
  hoursAgo: (n: number) => string;
  daysAgo: (n: number) => string;
  monthsAgo: (n: number) => string;
  yearsAgo: (n: number) => string;
  updatedJustNow: string;
  updatedMinutesAgo: (n: number) => string;
  updatedHoursAgo: (n: number) => string;
  updatedDaysAgo: (n: number) => string;
};

export const EN_TIME_LOCALE: TimeLocale = {
  justNow: "just now",
  minutesAgo: (n) => `${n} ${n === 1 ? "minute" : "minutes"} ago`,
  hoursAgo: (n) => `${n} ${n === 1 ? "hour" : "hours"} ago`,
  daysAgo: (n) => `${n} ${n === 1 ? "day" : "days"} ago`,
  monthsAgo: (n) => `${n} ${n === 1 ? "month" : "months"} ago`,
  yearsAgo: (n) => `${n} ${n === 1 ? "year" : "years"} ago`,
  updatedJustNow: "Updated just now",
  updatedMinutesAgo: (n) => `Updated ${n} ${n === 1 ? "minute" : "minutes"} ago`,
  updatedHoursAgo: (n) => `Updated ${n} ${n === 1 ? "hour" : "hours"} ago`,
  updatedDaysAgo: (n) => `Updated ${n} ${n === 1 ? "day" : "days"} ago`,
};

export const ID_TIME_LOCALE: TimeLocale = {
  justNow: "baru saja",
  minutesAgo: (n) => `${n} menit yang lalu`,
  hoursAgo: (n) => `${n} jam yang lalu`,
  daysAgo: (n) => `${n} hari yang lalu`,
  monthsAgo: (n) => `${n} bulan yang lalu`,
  yearsAgo: (n) => `${n} tahun yang lalu`,
  updatedJustNow: "Diperbarui baru saja",
  updatedMinutesAgo: (n) => `Diperbarui ${n} menit yang lalu`,
  updatedHoursAgo: (n) => `Diperbarui ${n} jam yang lalu`,
  updatedDaysAgo: (n) => `Diperbarui ${n} hari yang lalu`,
};

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
    locale?: TimeLocale;
  }
) {
  const d = toDate(updatedAt);
  if (!d) return "";

  const now = opts?.now ?? new Date();
  const thresholdDays = opts?.thresholdDays ?? 100;
  const locale = opts?.locale ?? EN_TIME_LOCALE;

  const diffMs = Math.max(0, now.getTime() - d.getTime());
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays >= thresholdDays) {
    return `Updated ${d.toISOString().slice(0, 10)}`;
  }

  if (diffMinutes < 1) return locale.updatedJustNow;
  if (diffHours < 1) return locale.updatedMinutesAgo(diffMinutes);
  if (diffDays < 1) return locale.updatedHoursAgo(diffHours);
  return locale.updatedDaysAgo(diffDays);
}


/**
 * Returns a relative label like:
 * - "just now"
 * - "12 minutes ago"
 * - "3 hours ago"
 * - "9 days ago"
 * - "2 months ago"
 */
export function formatTimeAgo(value: DateLike, opts?: { now?: Date; locale?: TimeLocale }) {
  const d = toDate(value);
  if (!d) return "";

  const now = opts?.now ?? new Date();
  const locale = opts?.locale ?? EN_TIME_LOCALE;
  const diffMs = Math.max(0, now.getTime() - d.getTime());
  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMinutes < 1) return locale.justNow;
  if (diffHours < 1) return locale.minutesAgo(diffMinutes);
  if (diffDays < 1) return locale.hoursAgo(diffHours);
  if (diffDays < 30) return locale.daysAgo(diffDays);
  if (diffDays < 365) return locale.monthsAgo(Math.max(1, diffMonths));
  return locale.yearsAgo(Math.max(1, diffYears));
}
