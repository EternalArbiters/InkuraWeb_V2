import { describe, expect, it } from "vitest";

import { buildCommentTree, safeCommentSort, sortRootComments } from "@/server/services/comments/tree";

const rows = [
  { id: "root-1", parentId: null, createdAt: "2026-03-06T00:00:00.000Z", likeCount: 2, isPinned: false },
  { id: "reply-2", parentId: "root-1", createdAt: "2026-03-06T00:03:00.000Z", likeCount: 0, isPinned: false },
  { id: "reply-1", parentId: "root-1", createdAt: "2026-03-06T00:01:00.000Z", likeCount: 0, isPinned: false },
  { id: "orphan", parentId: "missing", createdAt: "2026-03-06T00:02:00.000Z", likeCount: 9, isPinned: false },
  {
    id: "pinned",
    parentId: null,
    createdAt: "2026-03-06T00:04:00.000Z",
    pinnedAt: "2026-03-06T00:05:00.000Z",
    likeCount: 1,
    isPinned: true,
  },
];

describe("comment tree helpers", () => {
  it("normalizes legacy sort aliases to newest", () => {
    expect(safeCommentSort("new")).toBe("newest");
    expect(safeCommentSort("latest")).toBe("newest");
    expect(safeCommentSort("top")).toBe("top");
  });

  it("builds a nested tree and keeps orphaned comments as roots", () => {
    const tree = buildCommentTree(rows);
    const root = tree.find((item) => item.id === "root-1");
    const orphan = tree.find((item) => item.id === "orphan");

    expect(root?.replies.map((reply: any) => reply.id)).toEqual(["reply-1", "reply-2"]);
    expect(orphan).toBeTruthy();
    expect(tree.map((item) => item.id)).toContain("orphan");
  });

  it("keeps pinned roots first and sorts the rest by the requested mode", () => {
    const roots = buildCommentTree(rows);
    const sorted = sortRootComments("top", roots);

    expect(sorted.map((item) => item.id)).toEqual(["pinned", "orphan", "root-1"]);
  });
});
