import { describe, expect, it } from "vitest";

import {
  normalizeCommunityUserLookup,
  parseDonationAmount,
  parseDonationDate,
  sanitizeDonationCurrency,
  sanitizeDonationNote,
} from "@/server/services/admin/community";

describe("admin community helpers", () => {
  it("normalizes donor lookup handles", () => {
    expect(normalizeCommunityUserLookup("@clio")).toBe("clio");
    expect(normalizeCommunityUserLookup("  user@example.com  ")).toBe("user@example.com");
  });

  it("sanitizes donation fields", () => {
    expect(sanitizeDonationCurrency("idr ")).toBe("IDR");
    expect(sanitizeDonationCurrency("usd-01")).toBe("USD01");
    expect(sanitizeDonationNote("   hello donor   ")).toBe("hello donor");
    expect(sanitizeDonationNote("   ")).toBeNull();
  });

  it("parses positive donation amounts and dates", () => {
    expect(parseDonationAmount("12500.5")).toBe(12500.5);
    expect(parseDonationDate("2026-03-18T10:20:00.000Z").toISOString()).toBe("2026-03-18T10:20:00.000Z");
    expect(() => parseDonationAmount(0)).toThrowError("Amount must be greater than 0");
    expect(() => parseDonationDate("not-a-date")).toThrowError("Invalid donation date");
  });
});
