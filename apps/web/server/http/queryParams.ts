import "server-only";

export function getOptionalStringParam(searchParams: URLSearchParams, key: string): string | undefined {
  const value = searchParams.get(key);
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function getOptionalIntParam(
  searchParams: URLSearchParams,
  key: string,
  options?: { min?: number; max?: number }
): number | undefined {
  const raw = getOptionalStringParam(searchParams, key);
  if (!raw) return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) return undefined;
  let next = parsed;
  if (typeof options?.min === "number") next = Math.max(options.min, next);
  if (typeof options?.max === "number") next = Math.min(options.max, next);
  return next;
}

export function getBooleanFlagParam(searchParams: URLSearchParams, key: string): boolean {
  const raw = getOptionalStringParam(searchParams, key);
  if (!raw) return false;
  const normalized = raw.toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function getOptionalEnumParam<const T extends readonly string[]>(
  searchParams: URLSearchParams,
  key: string,
  allowed: T,
  options?: { normalize?: (value: string) => string }
): T[number] | undefined {
  const raw = getOptionalStringParam(searchParams, key);
  if (!raw) return undefined;
  const normalized = options?.normalize ? options.normalize(raw) : raw;
  return (allowed as readonly string[]).includes(normalized) ? (normalized as T[number]) : undefined;
}
