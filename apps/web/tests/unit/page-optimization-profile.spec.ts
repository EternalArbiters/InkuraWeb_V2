import { describe, expect, it } from "vitest";

import { getUploadProfile } from "@/lib/uploadProfiles";
import { getTargetImageDimensions } from "@/lib/uploadOptimization";

describe("comic page optimization profile", () => {
  it("keeps page optimization conservative for readability", () => {
    const profile = getUploadProfile("pages");
    expect(profile.quality).toBeGreaterThanOrEqual(0.84);
    expect(profile.maxMegapixels).toBe(6);
    expect(profile.maxWidth).toBe(1800);
    expect(profile.maxHeight).toBe(3200);
    expect(profile.skipReencodeBelowBytes).toBe(900 * 1024);
  });

  it("applies adaptive downscaling to oversized page images", () => {
    const portrait = getTargetImageDimensions({ scope: "pages", width: 2800, height: 5600 });
    expect(portrait.width).toBeLessThanOrEqual(1600);
    expect(portrait.height).toBeLessThanOrEqual(3200);
    expect(portrait.resized).toBe(true);

    const landscape = getTargetImageDimensions({ scope: "pages", width: 4200, height: 1800 });
    expect(landscape.width).toBeLessThanOrEqual(1800);
    expect(landscape.height).toBeLessThanOrEqual(1800);
    expect(landscape.resized).toBe(true);
  });
});
