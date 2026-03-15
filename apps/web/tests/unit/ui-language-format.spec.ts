import { describe, expect, it } from "vitest";

import { formatUILanguageTemplate } from "@/lib/uiLanguageFormat";

describe("formatUILanguageTemplate", () => {
  it("replaces placeholders while keeping dynamic user content untouched", () => {
    expect(formatUILanguageTemplate("Open {title}", { title: "My Story" })).toBe("Open My Story");
    expect(formatUILanguageTemplate("Sent to {target}", { target: "@alice" })).toBe("Sent to @alice");
  });

  it("preserves unknown placeholders", () => {
    expect(formatUILanguageTemplate("Open {title}", {})).toBe("Open {title}");
  });
});
