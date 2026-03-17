import { describe, expect, it } from "vitest";

import { getUploadProfile } from "@/lib/uploadProfiles";
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
    expect(normalizeUploadScope("admin-report-attachments")).toBe("admin_report_attachments");
    expect(normalizeUploadScope("unknown-scope")).toBe("files");
  });

  it("enforces content-type guardrails and size caps per scope", () => {
    expect(normalizeUploadContentType("cover.png", "")).toBe("image/png");
    expect(isAllowedUploadContentType("covers", "image/jpeg")).toBe(true);
    expect(isAllowedUploadContentType("admin_report_attachments", "application/pdf")).toBe(true);
    expect(isAllowedUploadContentType("comment_gifs", "image/png")).toBe(false);
    expect(maxBytesForUploadScope("comment_gifs")).toBe(5 * 1024 * 1024);
    expect(maxBytesForUploadScope("covers")).toBe(getUploadProfile("covers").maxBytes);
    expect(maxBytesForUploadScope("admin_report_attachments")).toBe(getUploadProfile("admin_report_attachments").maxBytes);
    expect(maxBytesForUploadScope("comment_images")).toBe(getUploadProfile("comment_images").maxBytes);
  });

  it("reads profile-based limits for optimized image scopes", () => {
    const avatar = getUploadProfile("avatar");
    const pages = getUploadProfile("pages");

    expect(avatar.minWidth).toBe(64);
    expect(avatar.maxLongEdge).toBe(640);
    expect(pages.maxLongEdge).toBe(3600);
    expect(pages.maxMegapixels).toBe(10);
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
