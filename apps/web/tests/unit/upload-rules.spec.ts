import { describe, expect, it } from "vitest";

import {
  extFromUploadContentType,
  isAllowedUploadContentType,
  makeCommentMediaObjectKey,
  maxBytesForUploadScope,
  normalizeSha256,
  normalizeUploadContentType,
  normalizeUploadScope,
} from "@/server/uploads/presignRules";

describe("upload presign rules", () => {
  it("normalizes upload scopes and falls back to files", () => {
    expect(normalizeUploadScope("cover")).toBe("covers");
    expect(normalizeUploadScope("comment-images")).toBe("comment_images");
    expect(normalizeUploadScope("unknown-scope")).toBe("files");
  });

  it("enforces content-type guardrails and size caps per scope", () => {
    expect(normalizeUploadContentType("cover.png", "")).toBe("image/png");
    expect(isAllowedUploadContentType("covers", "image/jpeg")).toBe(true);
    expect(isAllowedUploadContentType("comment_gifs", "image/png")).toBe(false);
    expect(maxBytesForUploadScope("comment_gifs")).toBe(5 * 1024 * 1024);
  });

  it("normalizes sha256 hashes and generates deterministic comment media keys", () => {
    const hash = normalizeSha256("A".repeat(64));

    expect(hash).toBe("a".repeat(64));
    expect(extFromUploadContentType("image/jpeg", "Poster.JPEG")).toBe("jpg");
    expect(
      makeCommentMediaObjectKey({
        sha256: hash!,
        scope: "comment_images",
        ext: "jpg",
      })
    ).toBe(`media/comment/image/${"a".repeat(64)}.jpg`);
  });
});
