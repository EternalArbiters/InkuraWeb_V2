import { describe, expect, it } from "vitest";

import { publicCacheControl } from "@/server/http/cacheControl";

describe("publicCacheControl", () => {
  it("returns sane defaults for public GET responses", () => {
    expect(publicCacheControl()).toBe("public, s-maxage=300, stale-while-revalidate=86400");
  });

  it("clamps invalid values to safe minimums", () => {
    expect(publicCacheControl({ sMaxAge: 0, staleWhileRevalidate: -1 })).toBe(
      "public, s-maxage=1, stale-while-revalidate=0"
    );
  });
});
