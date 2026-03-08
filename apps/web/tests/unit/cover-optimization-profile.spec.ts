import { describe, expect, it } from "vitest";

import { getUploadProfile } from "@/lib/uploadProfiles";
import { getTargetImageDimensions } from "@/lib/uploadOptimization";

describe("cover optimization profile", () => {
  it("keeps cover output aligned with the canonical 3:4 contract", () => {
    const profile = getUploadProfile("covers");
    expect(profile.maxWidth).toBe(900);
    expect(profile.maxHeight).toBe(1200);
    expect(profile.targetAspectRatio).toBeCloseTo(3 / 4, 5);
    expect(profile.quality).toBeGreaterThanOrEqual(0.8);
  });

  it("downscales oversized covers to the canonical dimensions", () => {
    const dims = getTargetImageDimensions({ scope: "covers", width: 1800, height: 2400 });
    expect(dims.width).toBe(900);
    expect(dims.height).toBe(1200);
    expect(dims.resized).toBe(true);
  });
});
