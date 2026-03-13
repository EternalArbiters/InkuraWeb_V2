import "server-only";

import type { UserGender } from "@prisma/client";
import { normalizeInkuraLanguage } from "@/lib/inkuraLanguage";

const ALLOWED_GENDERS = new Set<UserGender | string>(["MALE", "FEMALE", "PREFER_NOT_TO_SAY"]);

export function normalizeGender(raw: unknown): UserGender | null | undefined {
  if (raw === null) return null;
  if (raw === undefined) return undefined;
  const value = String(raw).trim().toUpperCase();
  if (!value) return null;
  return ALLOWED_GENDERS.has(value) ? (value as UserGender) : undefined;
}

export function normalizeBirthMonth(raw: unknown): number | null | undefined {
  if (raw === null) return null;
  if (raw === undefined || raw === "") return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) return undefined;
  const month = Math.floor(value);
  if (month < 1 || month > 12) return undefined;
  return month;
}

export function normalizeBirthYear(raw: unknown): number | null | undefined {
  if (raw === null) return null;
  if (raw === undefined || raw === "") return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) return undefined;
  const year = Math.floor(value);
  const maxYear = new Date().getFullYear();
  if (year < 1900 || year > maxYear) return undefined;
  return year;
}

export function hasCompleteDemographics(input: {
  gender?: string | null;
  birthMonth?: number | null;
  birthYear?: number | null;
}) {
  return !!input.gender && !!input.birthMonth && !!input.birthYear;
}

export function hasCompletedProfileOnboarding(input: {
  gender?: string | null;
  birthMonth?: number | null;
  birthYear?: number | null;
  inkuraLanguage?: string | null;
}) {
  return hasCompleteDemographics(input) && !!normalizeInkuraLanguage(input.inkuraLanguage);
}
