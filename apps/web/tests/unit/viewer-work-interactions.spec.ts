import { describe, expect, it } from "vitest";
import { applyViewerWorkInteractions, emptyViewerWorkInteractions } from "@/server/services/works/viewerInteractions";

describe("viewer work interactions helpers", () => {
  it("adds favorited and bookmarked flags from interaction sets", () => {
    const works = [{ id: "w1", title: "One" }, { id: "w2", title: "Two" }];

    const rows = applyViewerWorkInteractions(works, {
      likedIds: new Set(["w2"]),
      bookmarkedIds: new Set(["w1"]),
    });

    expect(rows).toEqual([
      { id: "w1", title: "One", viewerFavorited: false, viewerBookmarked: true },
      { id: "w2", title: "Two", viewerFavorited: true, viewerBookmarked: false },
    ]);
  });

  it("returns false flags for empty interaction sets", () => {
    const rows = applyViewerWorkInteractions([{ id: "w1" }], emptyViewerWorkInteractions());
    expect(rows).toEqual([{ id: "w1", viewerFavorited: false, viewerBookmarked: false }]);
  });
});
