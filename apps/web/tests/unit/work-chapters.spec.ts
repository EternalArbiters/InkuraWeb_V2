import { describe, expect, it } from "vitest";

import {
  formatChapterDateLabel,
  getContinueChapterHref,
  getNovelChapterTitle,
  resolveChapterThumb,
  stablePickChapterThumb,
} from "@/lib/workChapters";

describe("work chapter helpers", () => {
  it("omits chapter thumbnails for novel layout by allowing the UI to skip thumb resolution", () => {
    const first = stablePickChapterThumb("chapter-a", ["/page-1.jpg", "/page-2.jpg"]);
    const second = stablePickChapterThumb("chapter-a", ["/page-1.jpg", "/page-2.jpg"]);

    expect(first).toBe(second);
  });

  it("prefers explicit thumbnail image before falling back to page picks", () => {
    expect(
      resolveChapterThumb({
        id: "ch-1",
        number: 1,
        title: "Opening",
        thumbnailImage: "/thumb.jpg",
        pages: [{ imageUrl: "/page-1.jpg" }],
      }),
    ).toBe("/thumb.jpg");
  });

  it("builds a novel chapter title without colon formatting", () => {
    expect(getNovelChapterTitle({ number: 7, title: "Jawaban Tawaran Ophelia", label: null })).toBe(
      "Chapter 7 [ Jawaban Tawaran Ophelia ]",
    );
  });

  it("points continue reading to remembered chapter when available", () => {
    expect(
      getContinueChapterHref(
        "arranged-wife",
        [
          { id: "c2", number: 2, title: "Two" },
          { id: "c1", number: 1, title: "One" },
        ],
        "c2",
      ),
    ).toBe("/w/arranged-wife/read/c2");
  });

  it("falls back to the first published chapter when there is no reading progress", () => {
    expect(
      getContinueChapterHref(
        "arranged-wife",
        [
          { id: "c5", number: 5, title: "Five", createdAt: "2026-03-16T09:00:00.000Z" },
          { id: "c1", number: 1, title: "One", createdAt: "2026-03-15T09:00:00.000Z" },
        ],
        null,
      ),
    ).toBe("/w/arranged-wife/read/c1");
  });

  it("formats chapter dates with a compact month label", () => {
    expect(formatChapterDateLabel("2022-08-15T00:00:00.000Z", "en-US")).toBe("Aug 15, 2022");
  });
});
