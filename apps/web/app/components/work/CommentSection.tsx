"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ensureCommentMedia } from "@/lib/commentMediaClient";
import {
  Check,
  CornerDownRight,
  Eye,
  EyeOff,
  Flag,
  Image as ImageIcon,
  Link2,
  Pencil,
  RefreshCw,
  SendHorizonal,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Pin,
  X,
} from "lucide-react";

type TargetType = "WORK" | "CHAPTER";

type ScopeMode = "target" | "workChapters";

type SortMode = "newest" | "oldest" | "top" | "bottom";

type CommentUser = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
};

type CommentMedia = {
  id: string;
  type: "COMMENT_IMAGE" | "COMMENT_GIF";
  url: string;
  contentType: string;
  sizeBytes: number;
};

type CommentAttachment = {
  id: string;
  type: "IMAGE" | "GIF";
  media: CommentMedia;
};

type CommentItem = {
  id: string;
  targetType: TargetType;
  targetId: string;
  parentId?: string | null;
  body: string;
  createdAt: string;
  editedAt?: string | null;
  isHidden?: boolean;
  isSpoiler?: boolean;
  user: CommentUser;
  attachments?: CommentAttachment[];
  likeCount?: number;
  dislikeCount?: number;
  isPinned?: boolean;
  pinnedAt?: string | null;
  viewerLiked?: boolean;
  viewerDisliked?: boolean;
  userRating?: number | null;
  replies?: CommentItem[];
};

// Avoid a replies type intersection (CommentItem.replies vs DecoratedComment.replies)
// which can cause TS to infer replies items as CommentItem instead of DecoratedComment.
type DecoratedComment = Omit<CommentItem, "replies"> & {
  createdAtLabel: string;
  editedAtLabel: string | null;
  displayName: string;
  replies?: DecoratedComment[];
};

function normalizeSort(v: unknown): SortMode {
  const s = String(v || "").toLowerCase().trim();
  if (s === "top") return "top";
  if (s === "bottom") return "bottom";
  if (s === "oldest") return "oldest";
  if (s === "newest" || s === "latest" || s === "new") return "newest";
  return "top";
}

function parseHiddenInline(body: string): Array<{ type: "text" | "hidden"; value: string }> {
  // Delimiter: ||hidden|| (non-nested). Unmatched delimiters are treated as plain text.
  const out: Array<{ type: "text" | "hidden"; value: string }> = [];
  let i = 0;
  while (i < body.length) {
    const open = body.indexOf("||", i);
    if (open === -1) {
      out.push({ type: "text", value: body.slice(i) });
      break;
    }
    const close = body.indexOf("||", open + 2);
    if (close === -1) {
      out.push({ type: "text", value: body.slice(i) });
      break;
    }
    if (open > i) out.push({ type: "text", value: body.slice(i, open) });
    out.push({ type: "hidden", value: body.slice(open + 2, close) });
    i = close + 2;
  }
  return out;
}

function isProbablyUrl(s: string) {
  const v = s.trim();
  if (!v) return false;
  return v.startsWith("http://") || v.startsWith("https://") || v.startsWith("www.");
}

function normalizeUrl(s: string) {
  const v = s.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("www.")) return `https://${v}`;
  return v;
}

function renderUrls(seg: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = urlRegex.exec(seg))) {
    const rawMatch = m[0];
    const start = m.index;
    const end = start + rawMatch.length;

    if (start > cursor) out.push(seg.slice(cursor, start));

    // Trim common trailing punctuation
    let raw = rawMatch;
    let trailing = "";
    while (raw.length && /[\]\[\)\}\.,!?:;]$/.test(raw)) {
      trailing = raw.slice(-1) + trailing;
      raw = raw.slice(0, -1);
    }

    const href = normalizeUrl(raw);
    out.push(
      <a
        key={`${keyBase}-url-${start}-${end}`}
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-purple-600 dark:text-purple-400 hover:underline break-words"
      >
        {raw}
      </a>
    );
    if (trailing) out.push(trailing);
    cursor = end;
  }
  if (cursor < seg.length) out.push(seg.slice(cursor));
  return out;
}

function renderTextWithLinks(text: string, keyBase: string): ReactNode[] {
  // Supports bare URLs + simple markdown links: [text](https://...)
  const out: ReactNode[] = [];
  const mdLink = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = mdLink.exec(text))) {
    const start = m.index;
    const end = start + m[0].length;
    if (start > cursor) out.push(...renderUrls(text.slice(cursor, start), `${keyBase}-pre-${cursor}-${start}`));

    const label = m[1];
    const url = m[2];
    out.push(
      <a
        key={`${keyBase}-md-${start}-${end}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="text-purple-600 dark:text-purple-400 hover:underline break-words"
      >
        {label}
      </a>
    );
    cursor = end;
  }
  if (cursor < text.length) out.push(...renderUrls(text.slice(cursor), `${keyBase}-tail-${cursor}`));
  return out;
}

function CommentBody({ body, className }: { body: string; className?: string }) {
  const tokens = useMemo(() => parseHiddenInline(body), [body]);
  const [open, setOpen] = useState<Record<number, boolean>>({});

  return (
    <div className={className || ""} style={{ whiteSpace: "pre-wrap" }}>
      {tokens.map((t, idx) => {
        if (t.type === "text") {
          return <span key={idx}>{renderTextWithLinks(t.value, `t-${idx}`)}</span>;
        }

        const shown = !!open[idx];
        if (!shown) {
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setOpen((p) => ({ ...p, [idx]: true }))}
              className="inline-flex items-center gap-1 align-baseline mx-0.5 px-2 py-0.5 rounded-md border border-purple-300/60 dark:border-purple-500/40 bg-purple-50/70 dark:bg-purple-950/25 text-[12px] font-semibold text-purple-700 dark:text-purple-300 hover:brightness-95"
              title="Tap to reveal"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Hidden
            </button>
          );
        }

        return (
          <span
            key={idx}
            onClick={() => setOpen((p) => ({ ...p, [idx]: false }))}
            className="inline rounded-md px-1 bg-purple-50/60 dark:bg-purple-950/25 cursor-pointer"
            title="Tap to hide"
          >
            {renderTextWithLinks(t.value, `h-${idx}`)}
          </span>
        );
      })}
    </div>
  );
}

function decorateTree(nodes: CommentItem[]): DecoratedComment[] {
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

function updateTree(nodes: CommentItem[], id: string, updater: (c: any) => any): CommentItem[] {
  return (nodes || []).map((c: any) => {
    if (c.id === id) return updater(c);
    if (Array.isArray(c.replies) && c.replies.length) {
      return { ...c, replies: updateTree(c.replies, id, updater) };
    }
    return c;
  });
}

function removeFromTree(nodes: CommentItem[], id: string): CommentItem[] {
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

export default function CommentSection({
  targetType,
  targetId,
  title = "Comments",
  take = 100,
  showComposer = true,
  // Keep legacy alias support ("latest"/"new") while using the canonical default.
  sort = "newest",
  variant = "full",
  scope = "target",
  workId,
  headerRight,
  showSortControl,
  showUserRating = false,
}: {
  targetType: TargetType;
  targetId: string;
  title?: string;
  take?: number;
  showComposer?: boolean;
  // Accept legacy aliases from older links/query params.
  sort?: SortMode | "new" | "latest";
  variant?: "full" | "compact";
  scope?: ScopeMode;
  workId?: string;
  headerRight?: ReactNode;
  showSortControl?: boolean;
  showUserRating?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const viewerId = (session?.user as any)?.id as string | undefined;

  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [canModerate, setCanModerate] = useState(false);

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const [replyTo, setReplyTo] = useState<
    | {
        id: string;
        targetType: TargetType;
        targetId: string;
        displayName: string;
      }
    | null
  >(null);
  const [replyText, setReplyText] = useState("");

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const replyRef = useRef<HTMLTextAreaElement | null>(null);

  const allowCompose = showComposer && scope === "target";
  const allowSort =
    showSortControl !== undefined
      ? showSortControl
      : variant !== "compact" && !headerRight;

  const [sortMode, setSortMode] = useState<SortMode>(() => normalizeSort(sort));
  useEffect(() => {
    setSortMode(normalizeSort(sort));
  }, [sort]);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const qs =
        scope === "workChapters"
          ? new URLSearchParams({
              scope: "workChapters",
              workId: String(workId || targetId),
              take: String(take || 100),
            })
          : new URLSearchParams({
              targetType,
              targetId,
              take: String(take || 100),
            });
      qs.set("sort", sortMode);
      if (showUserRating && targetType === "WORK" && scope === "target") {
        qs.set("includeUserRating", "1");
      }

      const res = await fetch(`/api/comments?${qs.toString()}`, { cache: "no-store" as any });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Gagal memuat comments");
        setLoading(false);
        return;
      }
      setCanModerate(!!data?.canModerate);
      setComments((data?.comments || []) as CommentItem[]);
      setLoading(false);
    } catch {
      setError("Gagal memuat comments");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId, take, scope, workId, sortMode]);

  // Focus/highlight a comment from URL param (?c=commentId)
  useEffect(() => {
    const cid = searchParams.get("c");
    if (!cid) return;
    if (loading) return;

    const el = document.getElementById(`comment-${cid}`);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setFocusedId(cid);
    const t = setTimeout(() => setFocusedId(null), 3000);
    return () => clearTimeout(t);
  }, [searchParams, loading, comments]);

  const pretty = useMemo(() => decorateTree(comments), [comments]);

  const onPickFiles = (picked: FileList | null) => {
    if (!picked) return;
    const arr = Array.from(picked);
    const merged = [...files, ...arr].slice(0, 3);
    setFiles(merged);
  };

  const removeFileAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const applyHidden = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = text;

    if (start === end) {
      const next = value.slice(0, start) + "||||" + value.slice(end);
      setText(next);
      requestAnimationFrame(() => {
        const e = textareaRef.current;
        if (!e) return;
        e.focus();
        e.setSelectionRange(start + 2, start + 2);
      });
      return;
    }

    const selected = value.slice(start, end);
    const wrapped = `||${selected}||`;
    const next = value.slice(0, start) + wrapped + value.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      const e = textareaRef.current;
      if (!e) return;
      e.focus();
      const pos = start + wrapped.length;
      e.setSelectionRange(pos, pos);
    });
  };

  const insertLink = () => {
    const urlRaw = window.prompt("Paste link URL (https://...)")?.trim();
    if (!urlRaw) return;
    const url = isProbablyUrl(urlRaw) ? normalizeUrl(urlRaw) : urlRaw;

    const el = textareaRef.current;
    if (!el) {
      setText((prev) => (prev ? `${prev}\n${url}` : url));
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = text;
    const selected = start !== end ? value.slice(start, end) : "";

    const insert = selected ? `[${selected}](${url})` : url;
    const next = value.slice(0, start) + insert + value.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      const e = textareaRef.current;
      if (!e) return;
      e.focus();
      const pos = start + insert.length;
      e.setSelectionRange(pos, pos);
    });
  };

  const submit = () => {
    setError(null);
    setUnauthorized(false);
    setInfo(null);
    const body = text.trim();
    if (!body) return;

    startTransition(async () => {
      try {
        const media = [] as { mediaId: string }[];
        for (const f of files) {
          const kind = f.type === "image/gif" ? "gif" : "image";
          const m = await ensureCommentMedia({ file: f, kind });
          media.push({ mediaId: m.id });
        }

        const res = await fetch(`/api/comments`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            targetType,
            targetId,
            body,
            attachments: media,
          }),
        });
        if (res.status === 401) {
          setUnauthorized(true);
          return;
        }
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) {
          setError(data?.error || "Gagal kirim comment");
          return;
        }
        setText("");
        setFiles([]);
        await fetchComments();
        router.refresh();
      } catch (e: any) {
        const msg = e?.message || "Gagal kirim comment";
        if (String(msg).toLowerCase().includes("unauthorized")) {
          setUnauthorized(true);
          return;
        }
        setError(msg);
      }
    });
  };

  const startReply = (c: DecoratedComment) => {
    if (c.isHidden) return;
    setReplyTo({ id: c.id, targetType: c.targetType, targetId: c.targetId, displayName: c.displayName });
    setReplyText("");
    setEditingId(null);
    setEditingText("");
    setReportFor(null);
    setReportReason("");
    setError(null);
    setInfo(null);
    requestAnimationFrame(() => {
      replyRef.current?.focus();
    });
  };

  const cancelReply = () => {
    setReplyTo(null);
    setReplyText("");
  };

  const submitReply = () => {
    if (!replyTo) return;
    const body = replyText.trim();
    if (!body) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/comments`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            targetType: replyTo.targetType,
            targetId: replyTo.targetId,
            parentId: replyTo.id,
            body,
          }),
        });
        if (res.status === 401) {
          setUnauthorized(true);
          return;
        }
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) {
          setError(data?.error || "Gagal kirim reply");
          return;
        }
        setReplyTo(null);
        setReplyText("");
        await fetchComments();
        router.refresh();
      } catch {
        setError("Gagal kirim reply");
      }
    });
  };

  const toggleLikeComment = (commentId: string) => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Gagal like comment");
        return;
      }
      setComments((prev) =>
        updateTree(prev, commentId, (c: any) => ({
          ...c,
          likeCount: data.likeCount,
          dislikeCount: data.dislikeCount,
          viewerLiked: data.liked,
          viewerDisliked: data.liked ? false : c.viewerDisliked,
        }))
      );
    });
  };

  const toggleDislikeComment = (commentId: string) => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await fetch(`/api/comments/${commentId}/dislike`, { method: "POST" });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Gagal dislike comment");
        return;
      }
      setComments((prev) =>
        updateTree(prev, commentId, (c: any) => ({
          ...c,
          likeCount: data.likeCount,
          dislikeCount: data.dislikeCount,
          viewerDisliked: data.disliked,
          viewerLiked: data.disliked ? false : c.viewerLiked,
        }))
      );
    });
  };

  const startEdit = (commentId: string, currentBody: string) => {
    setEditingId(commentId);
    setEditingText(currentBody);
    setReplyTo(null);
    setReplyText("");
    setReportFor(null);
    setReportReason("");
    setError(null);
    setInfo(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  const saveEdit = (commentId: string) => {
    const body = editingText.trim();
    if (!body) {
      setError("Comment tidak boleh kosong");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Gagal edit comment");
        return;
      }
      const updated = data?.comment;
      setComments((prev) =>
        updateTree(prev, commentId, (c: any) => ({
          ...c,
          body: updated.body,
          editedAt: updated.editedAt,
        }))
      );
      setEditingId(null);
      setEditingText("");
      router.refresh();
    });
  };

  const deleteComment = (commentId: string) => {
    const ok = window.confirm("Delete this comment? (Replies will also be deleted)");
    if (!ok) return;
    startTransition(async () => {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Gagal delete comment");
        return;
      }
      setComments((prev) => removeFromTree(prev, commentId));
      router.refresh();
    });
  };

  const toggleHide = (commentId: string, hide: boolean) => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await fetch(`/api/comments/${commentId}/hide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hide }),
      });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Gagal update comment");
        return;
      }
      setInfo(hide ? "Comment disembunyikan" : "Comment ditampilkan lagi");
      await fetchComments();
      router.refresh();
    });
  };

  const togglePin = (commentId: string, pin: boolean) => {
    setError(null);
    setInfo(null);
    startTransition(async () => {
      const res = await fetch(`/api/comments/${commentId}/pin`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Gagal pin comment");
        return;
      }
      setInfo(pin ? "Comment pinned" : "Comment unpinned");
      await fetchComments();
      router.refresh();
    });
  };

  const submitReport = async (commentId: string) => {
    setError(null);
    setInfo(null);
    setUnauthorized(false);
    const reason = reportReason.trim();
    if (!reason) {
      setError("Alasan report wajib diisi");
      return;
    }
    startTransition(async () => {
      const res = await fetch(`/api/reports`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetType: "COMMENT", targetId: commentId, reason }),
      });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || "Gagal kirim report");
        return;
      }
      setInfo("Report terkirim. Terima kasih!");
      setReportFor(null);
      setReportReason("");
    });
  };

  const onChangeSort = (next: SortMode) => {
    setSortMode(next);
    // Sync to URL (best-effort) for full pages.
    if (variant !== "compact" && scope === "target") {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("sort", next);
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  };

  const renderComment = (c: DecoratedComment, depth: number) => {
    const hidden = (c.isHidden ?? false) as boolean;
    const spoiler = (c.isSpoiler ?? false) as boolean;
    const showSpoiler = !spoiler || revealed[c.id];
    const likeCount = typeof c.likeCount === "number" ? c.likeCount : 0;
    const dislikeCount = typeof c.dislikeCount === "number" ? c.dislikeCount : 0;
    const viewerLiked = !!c.viewerLiked;
    const viewerDisliked = !!c.viewerDisliked;
    const isMine = !!viewerId && c.user?.id === viewerId;

    const isPinned = depth === 0 && !!(c as any).isPinned;
    const isFocused = focusedId === c.id;

    const isReplyingHere = replyTo?.id === c.id;

    return (
      <div
        key={c.id}
        id={`comment-${c.id}`}
        className={`rounded-xl border px-4 py-3 ${
          depth > 0 ? "bg-white/60 dark:bg-gray-950/80" : "bg-white dark:bg-gray-950"
        } ${
          isPinned ? "border-purple-300/70 dark:border-purple-500/40 ring-2 ring-purple-500/20" : "border-gray-200 dark:border-gray-800"
        } ${
          isFocused ? "ring-2 ring-amber-400/40" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{c.displayName}</div>
            {showUserRating && targetType === "WORK" && typeof (c as any).userRating === "number" ? (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => {
                  const v = Math.max(0, Math.min(5, Number((c as any).userRating)));
                  return (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5"
                      fill={i < v ? "currentColor" : "none"}
                    />
                  );
                })}
                <span className="ml-1 text-gray-600 dark:text-gray-300">{(c as any).userRating}/5</span>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {hidden ? (
              <span className="px-2 py-0.5 text-[11px] font-semibold border border-amber-300/60 text-amber-700 dark:text-amber-300 dark:border-amber-500/40">
                Hidden
              </span>
            ) : null}
            {isPinned ? (
              <span className="px-2 py-0.5 text-[11px] font-semibold border border-purple-300/60 text-purple-700 dark:text-purple-300 dark:border-purple-500/40">
                Pinned
              </span>
            ) : null}
            {spoiler ? (
              <span className="px-2 py-0.5 text-[11px] font-semibold border border-purple-300/60 text-purple-700 dark:text-purple-300 dark:border-purple-500/40">
                Hidden
              </span>
            ) : null}
            <div className="text-xs text-gray-600 dark:text-gray-300">{c.createdAtLabel}</div>
          </div>
        </div>

        {c.editedAtLabel ? (
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Edited: {c.editedAtLabel}</div>
        ) : null}

        {hidden ? (
          <p className="mt-2 text-sm whitespace-pre-line text-gray-500 dark:text-gray-400">(Komentar ini disembunyikan oleh moderator)</p>
        ) : spoiler && !showSpoiler ? (
          <button
            type="button"
            onClick={() => setRevealed((prev) => ({ ...prev, [c.id]: true }))}
            className="mt-2 w-full text-left rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            <span className="inline-flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              Hidden text — tap to reveal
            </span>
          </button>
        ) : editingId === c.id ? (
          <div className="mt-2">
            <textarea
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500 min-h-[88px]"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                aria-label="Cancel edit"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={isPending || !editingText.trim()}
                onClick={() => saveEdit(c.id)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
                aria-label="Save edit"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <CommentBody className="mt-2 text-sm text-gray-700 dark:text-gray-200 break-words" body={c.body} />
        )}

        {!hidden && showSpoiler && Array.isArray(c.attachments) && c.attachments.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {c.attachments.map((a) => (
              <div key={a.id} className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.media.url}
                  alt={a.type}
                  className="max-w-[240px] max-h-[240px] object-contain block"
                />
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggleLikeComment(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold border ${
              viewerLiked
                ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-950/25 dark:text-purple-200"
                : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
            title="Like"
            aria-label="Like"
          >
            <span className="inline-flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{likeCount}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => toggleDislikeComment(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold border ${
              viewerDisliked
                ? "border-gray-500/40 bg-gray-100 text-gray-900 dark:border-gray-400/30 dark:bg-gray-900/50 dark:text-gray-100"
                : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
            title="Dislike"
            aria-label="Dislike"
          >
            <span className="inline-flex items-center gap-1.5">
              <ThumbsDown className="w-3.5 h-3.5" />
              <span>{dislikeCount}</span>
            </span>
          </button>

          {!hidden ? (
            <button
              type="button"
              onClick={() => startReply(c)}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-900 ${
                isReplyingHere
                  ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-950/25 dark:text-purple-200"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              title="Reply"
              aria-label="Reply"
            >
              <CornerDownRight className="w-4 h-4" />
            </button>
          ) : null}

          {isMine ? (
            <>
              <button
                type="button"
                onClick={() => startEdit(c.id, c.body)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                title="Edit"
                aria-label="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => deleteComment(c.id)}
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                title="Delete"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setReportFor((prev) => (prev === c.id ? null : c.id));
              setReportReason("");
              setError(null);
              setInfo(null);
              setReplyTo(null);
              setReplyText("");
              setEditingId(null);
              setEditingText("");
            }}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-900 ${
              reportFor === c.id
                ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-950/25 dark:text-purple-200"
                : "border-gray-300 dark:border-gray-700"
            }`}
            title="Report"
            aria-label="Report"
          >
            <Flag className="w-4 h-4" />
          </button>

          {canModerate && depth === 0 && !hidden ? (
            <button
              type="button"
              onClick={() => togglePin(c.id, !isPinned)}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-900 ${
                isPinned
                  ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-950/25 dark:text-purple-200"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              title={isPinned ? "Unpin" : "Pin"}
              aria-label={isPinned ? "Unpin" : "Pin"}
            >
              <Pin className="w-4 h-4" />
            </button>
          ) : null}

          {canModerate ? (
            <button
              type="button"
              onClick={() => toggleHide(c.id, !hidden)}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-900 ${
                hidden
                  ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/25 dark:text-amber-200"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              title={hidden ? "Unhide" : "Hide"}
              aria-label={hidden ? "Unhide" : "Hide"}
            >
              {hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          ) : null}
        </div>

        {isReplyingHere ? (
          <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-3">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              Reply to <span className="text-purple-700 dark:text-purple-300">{replyTo?.displayName}</span>
            </div>
            <textarea
              ref={replyRef}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="mt-2 w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="text-[11px] text-gray-600 dark:text-gray-300">Tip: you can hide text with ||like this||</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelReply}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                  aria-label="Cancel reply"
                  title="Cancel"
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={isPending || !replyText.trim()}
                  onClick={submitReply}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
                  aria-label="Send reply"
                  title="Send"
                >
                  <SendHorizonal className={`w-4 h-4 ${isPending ? "animate-pulse" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {reportFor === c.id ? (
          <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-3">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">Alasan report</div>
            <input
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Misal: spam, hate speech, harassment..."
              className="mt-2 w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReportFor(null);
                  setReportReason("");
                }}
                className="rounded-full px-3 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || !reportReason.trim()}
                onClick={() => submitReport(c.id)}
                className="rounded-full px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
              >
                {isPending ? "Sending..." : "Submit"}
              </button>
            </div>
          </div>
        ) : null}

        {Array.isArray(c.replies) && c.replies.length ? (
          <div className="mt-3 border-l border-gray-200 dark:border-gray-800 pl-3 space-y-3">
            {c.replies.map((r) => renderComment(r, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <section id="comments" className={variant === "compact" ? "mt-6" : "mt-10"}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <div className="flex items-center gap-2">
          {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
          {allowSort ? (
            <select
              value={sortMode}
              onChange={(e) => onChangeSort(e.target.value as SortMode)}
              className="rounded-full border border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-900/50 px-3 py-2 text-sm text-gray-800 dark:text-white outline-none hover:bg-gray-50 dark:hover:bg-gray-900"
              aria-label="Sort"
              title="Sort"
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          ) : null}
          <button
            type="button"
            onClick={fetchComments}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-5">
        {allowCompose ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
              placeholder="Tulis comment..."
            />

            {/* Toolbar: keep Send pinned to the right (mobile-safe) */}
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 overflow-x-auto pr-2 no-scrollbar flex-nowrap">
                <button
                  type="button"
                  onClick={applyHidden}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                  title="Hidden (wrap selection with || ||)"
                  aria-label="Hidden"
                >
                  <EyeOff className="w-4 h-4" />
                </button>

                <label
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer"
                  title="Attach image/GIF"
                  aria-label="Attach image/GIF"
                >
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => onPickFiles(e.target.files)} />
                  <ImageIcon className="w-4 h-4" />
                </label>

                <button
                  type="button"
                  onClick={insertLink}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                  title="Insert link"
                  aria-label="Insert link"
                >
                  <Link2 className="w-4 h-4" />
                </button>

                <span className="text-[11px] text-gray-600 dark:text-gray-300">({files.length}/3)</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isPending || !text.trim()}
                onClick={submit}
                className="shrink-0 inline-flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
                aria-label="Send"
                title="Send"
              >
                <SendHorizonal className={`w-5 h-5 ${isPending ? "animate-pulse" : ""}`} />
              </button>
            </div>

            {files.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {files.map((f, idx) => {
                  const url = URL.createObjectURL(f);
                  return (
                    <div key={idx} className="relative border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={f.name} className="w-20 h-20 object-cover block" />
                      <button
                        type="button"
                        onClick={() => removeFileAt(idx)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 text-white text-xs font-bold"
                        aria-label="Remove"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
          {unauthorized ? (
            <span>
              Kamu belum login. {" "}
              <Link
                className="font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`}
              >
                Sign in
              </Link>
            </span>
          ) : null}
          {info ? <span className="ml-2 text-emerald-700 dark:text-emerald-400">{info}</span> : null}
          {error ? <span className="ml-2 text-red-600 dark:text-red-400">{error}</span> : null}
        </div>

        <hr className="my-5 border-gray-200 dark:border-gray-800" />

        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading...</p>
        ) : pretty.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Belum ada comment.</p>
        ) : (
          <div className="space-y-4">{pretty.map((c) => renderComment(c, 0))}</div>
        )}
      </div>
    </section>
  );
}
