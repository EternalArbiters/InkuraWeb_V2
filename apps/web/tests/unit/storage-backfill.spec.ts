import { describe, expect, it } from "vitest";

import { inferScopeFromKey, makeBackfillKey, matchesScopeFilter, normalizeScope } from "../../scripts/storageBackfill";

describe("storage backfill helpers", () => {
  it("infers managed scopes from object keys", () => {
    expect(inferScopeFromKey("users/u1/works/w1/covers/test.webp")).toBe("covers");
    expect(inferScopeFromKey("users/u1/works/w1/chapters/c1/pages/test.webp")).toBe("pages");
    expect(inferScopeFromKey("users/u1/files/avatar-me.webp")).toBe("avatar");
    expect(inferScopeFromKey(`media/comment/image/${"a".repeat(64)}.webp`)).toBe("comment_images");
    expect(inferScopeFromKey("misc/other.bin")).toBe(null);
  });

  it("builds versioned reopt keys without clobbering the original directory", () => {
    expect(makeBackfillKey({ originalKey: "users/u1/works/w1/covers/cover.webp", contentType: "image/webp" })).toBe(
      "users/u1/works/w1/covers/cover.reopt-v1.webp"
    );
    expect(makeBackfillKey({ originalKey: "users/u1/files/avatar-me.png", contentType: "image/jpeg", versionTag: "reopt-v2" })).toBe(
      "users/u1/files/avatar-me.reopt-v2.jpg"
    );
  });

  it("normalizes scope filters and matches managed prefixes", () => {
    expect(normalizeScope("pages")).toBe("pages");
    expect(matchesScopeFilter("users/u1/works/w1/covers/cover.webp", "all")).toBe(true);
    expect(matchesScopeFilter("users/u1/works/w1/covers/cover.webp", "covers")).toBe(true);
    expect(matchesScopeFilter("users/u1/works/w1/covers/cover.webp", "pages")).toBe(false);
  });
});
