import "server-only";

export type CommentSortMode = "newest" | "oldest" | "top" | "bottom";

export function safeCommentSort(v: unknown): CommentSortMode {
  const s = String(v || "").toLowerCase().trim();
  if (s === "top") return "top";
  if (s === "bottom") return "bottom";
  if (s === "oldest") return "oldest";
  if (s === "newest" || s === "latest" || s === "new") return "newest";
  return "newest";
}

export function sortRootComments(mode: CommentSortMode, items: any[]) {
  const pinned = items.filter((x) => !!x?.isPinned);
  const rest = items.filter((x) => !x?.isPinned);

  pinned.sort((a, b) => {
    const ta = +(a.pinnedAt ? new Date(a.pinnedAt) : new Date(a.createdAt));
    const tb = +(b.pinnedAt ? new Date(b.pinnedAt) : new Date(b.createdAt));
    if (tb !== ta) return tb - ta;
    const t2 = +new Date(b.createdAt) - +new Date(a.createdAt);
    if (t2 !== 0) return t2;
    return String(b.id).localeCompare(String(a.id));
  });

  const sorted = (() => {
    if (mode === "top") {
      return rest.sort((a, b) => {
        const lc = (b.likeCount ?? 0) - (a.likeCount ?? 0);
        if (lc !== 0) return lc;
        const t = +new Date(b.createdAt) - +new Date(a.createdAt);
        if (t !== 0) return t;
        return String(b.id).localeCompare(String(a.id));
      });
    }
    if (mode === "bottom") {
      return rest.sort((a, b) => {
        const lc = (a.likeCount ?? 0) - (b.likeCount ?? 0);
        if (lc !== 0) return lc;
        const t = +new Date(b.createdAt) - +new Date(a.createdAt);
        if (t !== 0) return t;
        return String(b.id).localeCompare(String(a.id));
      });
    }
    if (mode === "oldest") {
      return rest.sort((a, b) => {
        const t = +new Date(a.createdAt) - +new Date(b.createdAt);
        if (t !== 0) return t;
        return String(a.id).localeCompare(String(b.id));
      });
    }
    // newest
    return rest.sort((a, b) => {
      const t = +new Date(b.createdAt) - +new Date(a.createdAt);
      if (t !== 0) return t;
      return String(b.id).localeCompare(String(a.id));
    });
  })();

  return [...pinned, ...sorted];
}

export function buildCommentTree(all: any[]) {
  const byId = new Map<string, any>();
  for (const c of all) byId.set(String(c.id), { ...c, replies: [] as any[] });

  const roots: any[] = [];
  for (const node of byId.values()) {
    const pid = node.parentId ? String(node.parentId) : "";
    if (pid && byId.has(pid)) {
      byId.get(pid).replies.push(node);
    } else {
      roots.push(node);
    }
  }

  // replies in chronological order
  const sortReplies = (n: any) => {
    if (Array.isArray(n.replies) && n.replies.length) {
      n.replies.sort((a: any, b: any) => +new Date(a.createdAt) - +new Date(b.createdAt));
      for (const r of n.replies) sortReplies(r);
    }
  };
  for (const r of roots) sortReplies(r);

  return roots;
}
