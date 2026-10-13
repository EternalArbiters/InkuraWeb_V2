import { describe, expect, it } from "vitest";

import { getUploadProfile } from "@/lib/uploadProfiles";
import { getTargetImageDimensions } from "@/lib/uploadOptimization";

describe("comic page optimization profile", () => {
  it("keeps page optimization conservative for readability", () => {
    const profile = getUploadProfile("pages");
    expect(profile.quality).toBeGreaterThanOrEqual(0.98);
    expect(profile.maxMegapixels).toBe(20);
    expect(profile.maxWidth).toBe(3600);
    expect(profile.maxHeight).toBe(7200);
    expect(profile.skipReencodeBelowBytes).toBe(5120 * 1024);
  });

  it("applies adaptive downscaling to oversized page images", () => {
    // 32MP: over the 20MP ceiling and over maxHeight.
    const portrait = getTargetImageDimensions({ scope: "pages", width: 4000, height: 8000 });
    expect(portrait.width).toBeLessThanOrEqual(3600);
    expect(portrait.height).toBeLessThanOrEqual(7200);
    expect(portrait.resized).toBe(true);

    const landscape = getTargetImageDimensions({ scope: "pages", width: 4200, height: 1800 });
    expect(landscape.width).toBeLessThanOrEqual(3600);
    expect(landscape.height).toBeLessThanOrEqual(1800);
    expect(landscape.resized).toBe(true);
  });

  it("leaves pages that already fit the caps at their source resolution", () => {
    // Deliberate policy: anything inside 3600x7200 / 20MP is uploaded untouched
    // rather than re-sampled to a fixed target, so reader quality matches the source.
    const inRange = getTargetImageDimensions({ scope: "pages", width: 2800, height: 5600 });
    expect(inRange.width).toBe(2800);
    expect(inRange.height).toBe(5600);
    expect(inRange.resized).toBe(false);
  });

  it("keeps optimized page widths at least 400px when the original file already meets that threshold", () => {
    const tallPage = getTargetImageDimensions({ scope: "pages", width: 900, height: 7000 });
    expect(tallPage.width).toBeGreaterThanOrEqual(400);
    expect(tallPage.height).toBe(5600);
    expect(tallPage.resized).toBe(true);

    const genuinelySmallPage = getTargetImageDimensions({ scope: "pages", width: 320, height: 5000 });
    expect(genuinelySmallPage.width).toBe(320);
    expect(genuinelySmallPage.height).toBe(5000);
    expect(genuinelySmallPage.resized).toBe(false);
  });
});
