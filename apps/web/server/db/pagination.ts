import "server-only";

/**
 * Pagination helpers shared across API/services.
 *
 * Stage 7 goal: make list endpoints consistent and predictable.
 *
 * NOTE: We support both offset (skip/take) and cursor (cursor/take) styles.
 * Existing UI can keep using offset params; newer UI can opt into cursor.
 */

export function clampInt(v: unknown, def: number, min: number, max: number): number {
  const n = typeof v === "string" ? Number.parseInt(v, 10) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export function parseTake(searchParams: URLSearchParams, opts?: { key?: string; def?: number; min?: number; max?: number }): number {
  const key = opts?.key ?? "take";
  const def = opts?.def ?? 20;
  const min = opts?.min ?? 1;
  const max = opts?.max ?? 60;
  return clampInt(searchParams.get(key), def, min, max);
}

export function parseSkip(searchParams: URLSearchParams, opts?: { key?: string; def?: number; min?: number; max?: number }): number {
  const key = opts?.key ?? "skip";
  const def = opts?.def ?? 0;
  const min = opts?.min ?? 0;
  const max = opts?.max ?? 50_000;
  return clampInt(searchParams.get(key), def, min, max);
}

export function parseCursor(searchParams: URLSearchParams, opts?: { key?: string }): string | null {
  const key = opts?.key ?? "cursor";
  const raw = (searchParams.get(key) || "").trim();
  return raw ? raw : null;
}

export function nextCursorFromRows<T extends { id: string }>(rows: T[], take: number): string | null {
  if (!rows.length) return null;
  if (rows.length < take) return null;
  return rows[rows.length - 1]?.id ?? null;
}
