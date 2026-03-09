import { describe, expect, it } from "vitest";

import { readUploadOptimizationMeta, validateUploadOptimizationMeta } from "@/server/uploads/imageValidation";

describe("upload image validation", () => {
  it("accepts well-formed optimization metadata for optimized scopes", () => {
    const meta = readUploadOptimizationMeta({
      optimizationVersion: "pr5-upload-guardrails-v1",
      originalBytes: 512000,
      optimizedBytes: 128000,
      originalContentType: "image/png",
      optimizedContentType: "image/webp",
      width: 640,
      height: 640,
      compressionApplied: true,
      reason: "optimized",
    });

    const result = validateUploadOptimizationMeta({
      scope: "avatar",
      contentType: "image/webp",
      sizeBytes: 128000,
      meta,
    });

    expect(result.usedOptimizationMeta).toBe(true);
    expect(result.warnings).toEqual([]);
  });


  it("allows sub-400 page widths when the uploaded page metadata is otherwise valid", () => {
    const meta = readUploadOptimizationMeta({
      optimizationVersion: "pr5-upload-guardrails-v1",
      optimizedBytes: 320000,
      optimizedContentType: "image/webp",
      width: 320,
      height: 2400,
      compressionApplied: true,
      reason: "optimized",
    });

    const result = validateUploadOptimizationMeta({
      scope: "pages",
      contentType: "image/webp",
      sizeBytes: 320000,
      meta,
    });

    expect(result.usedOptimizationMeta).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it("allows fallback when optimization metadata is absent", () => {
    const result = validateUploadOptimizationMeta({
      scope: "pages",
      contentType: "image/jpeg",
      sizeBytes: 640000,
      meta: undefined,
    });

    expect(result.fallbackUsed).toBe(true);
    expect(result.warnings).toContain("optimization_meta_missing");
  });

  it("rejects mismatched optimization metadata payloads", () => {
    const meta = readUploadOptimizationMeta({
      optimizationVersion: "pr5-upload-guardrails-v1",
      optimizedBytes: 1000,
      optimizedContentType: "image/webp",
      width: 2000,
      height: 2000,
      compressionApplied: true,
      reason: "optimized",
    });

    expect(() =>
      validateUploadOptimizationMeta({
        scope: "avatar",
        contentType: "image/jpeg",
        sizeBytes: 1400,
        meta,
      })
    ).toThrow();
  });
});
