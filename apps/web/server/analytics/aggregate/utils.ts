import "server-only";

import { AnalyticsAgeBand, UserGender } from "@prisma/client";

export function startOfUtcDay(value: Date | string | number) {
  const input = new Date(value);
  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

export function addUtcDays(value: Date, days: number) {
  const copy = new Date(value);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

export function endOfUtcDayExclusive(value: Date | string | number) {
  return addUtcDays(startOfUtcDay(value), 1);
}

export function listUtcDays(start: Date | string | number, endInclusive: Date | string | number) {
  const startDay = startOfUtcDay(start);
  const endDay = startOfUtcDay(endInclusive);
  const dates: Date[] = [];
  for (let cursor = new Date(startDay); cursor <= endDay; cursor = addUtcDays(cursor, 1)) {
    dates.push(new Date(cursor));
  }
  return dates;
}

export function parseDateInput(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function normalizeDateRange(args: { start?: string | Date | null; end?: string | Date | null; days?: number | null }) {
  const today = startOfUtcDay(new Date());
  const end = args.end ? startOfUtcDay(args.end) : today;
  if (args.start) {
    return { start: startOfUtcDay(args.start), end };
  }
  const days = Math.max(1, Math.floor(Number(args.days || 1)));
  return { start: addUtcDays(end, -(days - 1)), end };
}

export function toIsoDate(value: Date | string | number) {
  return startOfUtcDay(value).toISOString().slice(0, 10);
}

export function getVisitorKey(event: { userId?: string | null; sessionKey?: string | null; ipHash?: string | null; id?: string | null }) {
  if (event.userId) return `user:${event.userId}`;
  if (event.sessionKey) return `session:${event.sessionKey}`;
  if (event.ipHash) return `ip:${event.ipHash}`;
  return `event:${event.id || Math.random().toString(36).slice(2)}`;
}

export function getAgeBand(args: { birthYear?: number | null; referenceDate: Date }) {
  const birthYear = Number(args.birthYear || 0);
  if (!birthYear || birthYear < 1900) return AnalyticsAgeBand.UNKNOWN;
  const age = args.referenceDate.getUTCFullYear() - birthYear;
  if (age < 18) return AnalyticsAgeBand.UNDER_18;
  if (age <= 24) return AnalyticsAgeBand.AGE_18_24;
  if (age <= 34) return AnalyticsAgeBand.AGE_25_34;
  if (age <= 44) return AnalyticsAgeBand.AGE_35_44;
  return AnalyticsAgeBand.AGE_45_PLUS;
}

export function normalizeGender(value?: UserGender | null) {
  return value ?? null;
}

export function normalizeSearchQuery(value?: string | null) {
  const query = String(value || "").trim().toLowerCase();
  return query || null;
}

export function extractGenreIds(event: { genreId?: string | null; metadata?: unknown }) {
  const ids = new Set<string>();
  if (event.genreId) ids.add(event.genreId);
  if (event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)) {
    const genreIds = (event.metadata as any).genreIds;
    if (Array.isArray(genreIds)) {
      for (const id of genreIds) {
        const value = String(id || "").trim();
        if (value) ids.add(value);
      }
    }
  }
  return Array.from(ids);
}

export function extractMetadataNumber(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as any)[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

export function extractMetadataString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = String((metadata as any)[key] || "").trim();
  return value || null;
}
