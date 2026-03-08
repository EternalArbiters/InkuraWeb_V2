import { describe, expect, it } from "vitest";

import { getUploadProfile, isAllowedUploadContentTypeForScope, isOptimizableUploadScope } from "@/lib/uploadProfiles";
import {
  chooseOptimizedContentType,
  getTargetImageDimensions,
  shouldSkipOptimization,
} from "@/lib/uploadOptimization";

describe("upload optimization profiles", () => {
  it("defines conservative profile contracts for each scope", () => {
    expect(getUploadProfile("avatar").preferredContentType).toBe("image/webp");
    expect(getUploadProfile("covers").targetAspectRatio).toBe(3 / 4);
    expect(getUploadProfile("pages").maxMegapixels).toBe(6);
    expect(getUploadProfile("comment_gifs").allowOptimization).toBe(false);
  });

  it("keeps scope-level content-type guardrails in sync with the shared profile map", () => {
    expect(isAllowedUploadContentTypeForScope("comment_images", "image/png")).toBe(true);
    expect(isAllowedUploadContentTypeForScope("comment_gifs", "image/png")).toBe(false);
    expect(isOptimizableUploadScope("pages")).toBe(true);
    expect(isOptimizableUploadScope("files")).toBe(false);
  });
});

describe("upload optimization decision helpers", () => {
  it("downscales oversized images conservatively per scope", () => {
    const avatarTarget = getTargetImageDimensions({ scope: "avatar", width: 2400, height: 2400 });
    expect(avatarTarget.width).toBe(640);
    expect(avatarTarget.height).toBe(640);
    expect(avatarTarget.resized).toBe(true);
    expect(avatarTarget.scale).toBeCloseTo(640 / 2400);

    const pageTarget = getTargetImageDimensions({ scope: "pages", width: 2200, height: 3600 });
    expect(pageTarget.width).toBeLessThanOrEqual(1800);
    expect(pageTarget.height).toBeLessThanOrEqual(3200);
    expect(pageTarget.resized).toBe(true);
  });

  it("picks alpha-safe webp output and skips tiny modern assets", () => {
    expect(
      chooseOptimizedContentType({
        scope: "comment_images",
        sourceContentType: "image/png",
        hasAlpha: true,
      })
    ).toBe("image/webp");

    expect(
      shouldSkipOptimization({
        scope: "avatar",
        contentType: "image/webp",
        sizeBytes: 120 * 1024,
        width: 320,
        height: 320,
      })
    ).toEqual({ skip: true, reason: "skip-small-modern" });
  });

  it("does not skip oversized or non-modern image inputs", () => {
    expect(
      shouldSkipOptimization({
        scope: "comment_images",
        contentType: "image/jpeg",
        sizeBytes: 600 * 1024,
        width: 2000,
        height: 1400,
      })
    ).toEqual({ skip: false, reason: "optimized" });

    expect(
      shouldSkipOptimization({
        scope: "comment_gifs",
        contentType: "image/gif",
        sizeBytes: 512 * 1024,
        width: 500,
        height: 500,
      })
    ).toEqual({ skip: true, reason: "scope-disabled" });
  });
});
