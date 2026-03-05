import type { CommentItem, DecoratedComment, SortMode } from "./types";

export function normalizeSort(v: unknown): SortMode {
  const s = String(v || "").toLowerCase().trim();
  if (s === "top") return "top";
  if (s === "bottom") return "bottom";
  if (s === "oldest") return "oldest";
  if (s === "newest" || s === "latest" || s === "new") return "newest";
  return "top";
}

export function decorateTree(nodes: CommentItem[]): DecoratedComment[] {
  return (nodes || []).map((c) => {
    const createdAtLabel = new Date(c.createdAt).toLocaleString();
    const editedAtLabel = c.editedAt ? new Date(c.editedAt).toLocaleString() : null;
    const displayName = c.user?.name || c.user?.username || "Unknown";
    return {
      ...c,
      createdAtLabel,
      editedAtLabel,
      displayName,
      replies: c.replies ? decorateTree(c.replies) : [],
    };
  });
}

export function updateTree(nodes: CommentItem[], id: string, updater: (c: any) => any): CommentItem[] {
  return (nodes || []).map((c: any) => {
    if (c.id === id) return updater(c);
    if (Array.isArray(c.replies) && c.replies.length) {
      return { ...c, replies: updateTree(c.replies, id, updater) };
    }
    return c;
  });
}

export function removeFromTree(nodes: CommentItem[], id: string): CommentItem[] {
  const out: CommentItem[] = [];
  for (const c of nodes || []) {
    if (c.id === id) continue;
    const next: any = { ...c };
    if (Array.isArray(next.replies) && next.replies.length) {
      next.replies = removeFromTree(next.replies, id);
    }
    out.push(next);
  }
  return out;
}
