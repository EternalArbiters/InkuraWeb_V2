import { describe, expect, it } from "vitest";

import { extFromUploadContentType, makeCommentMediaObjectKey } from "@/server/uploads/presignRules";

describe("comment media optimized storage contract", () => {
  it("stores optimized comment images by final content type extension", () => {
    const hash = "a".repeat(64);
    const ext = extFromUploadContentType("image/webp", "camera-roll.jpg");

    expect(ext).toBe("webp");
    expect(
      makeCommentMediaObjectKey({
        sha256: hash,
        scope: "comment_images",
        ext,
      })
    ).toBe(`media/comment/image/${hash}.webp`);
  });

  it("keeps gif comment keys unchanged for animated uploads", () => {
    const hash = "b".repeat(64);

    expect(
      makeCommentMediaObjectKey({
        sha256: hash,
        scope: "comment_gifs",
        ext: "gif",
      })
    ).toBe(`media/comment/gif/${hash}.gif`);
  });
});
