"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { RefreshCw } from "lucide-react";
import { useUILanguage, useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

import CommentComposer from "./comments/CommentComposer";
import CommentThread from "./comments/CommentThread";
import { useCommentComposer } from "./comments/useCommentComposer";
import { useComments } from "./comments/useComments";
import type { DecoratedComment, ReplyTarget, ScopeMode, SortMode, TargetType } from "./comments/types";
import { decorateTree, normalizeSort, removeFromTree, updateTree } from "./comments/utils";

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
  showChapterContext,
  initialComments,
  initialCanModerate,
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
  showChapterContext?: boolean;
  initialComments?: import("./comments/types").CommentItem[];
  initialCanModerate?: boolean;
}) {
  const router = useRouter();
  const t = useUILanguageText("Page Comments");
  const { language } = useUILanguage();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const viewerId = (session?.user as any)?.id as string | undefined;

  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const [reportFor, setReportFor] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const [replyTo, setReplyTo] = useState<ReplyTarget | null>(null);
  const [replyText, setReplyText] = useState("");

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [focusedId, setFocusedId] = useState<string | null>(null);

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

  const includeUserRating =
    showUserRating && targetType === "WORK" && scope === "target";

  const { loading, comments, setComments, canModerate, refresh: refreshComments } = useComments({
    targetType,
    targetId,
    take: take || 100,
    scope,
    workId,
    sortMode,
    includeUserRating,
    initialComments,
    initialCanModerate,
    onError: (msg) => setError(msg),
  });

  const composer = useCommentComposer({
    targetType,
    targetId,
    startTransition,
    filesLimit: 3,
    onBeforeSubmit: () => {
      setError(null);
      setInfo(null);
      setUnauthorized(false);
    },
    onUnauthorized: () => setUnauthorized(true),
    onError: (msg) => setError(msg),
    onSubmitted: async () => {
      await refreshComments({ force: true });
    },
  });

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

  const pretty = useMemo(() => decorateTree(comments, language as "EN" | "ID"), [comments, language]);

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
          setError(data?.error || t("Failed to send reply"));
          return;
        }
        setReplyTo(null);
        setReplyText("");
        await refreshComments({ force: true });
      } catch {
        setError(t("Failed to send reply"));
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
        setError(data?.error || "Failed to like comment");
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
        setError(data?.error || "Failed to dislike comment");
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
      setError("Comment cannot be empty");
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
        setError(data?.error || t("Failed to edit comment"));
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
    });
  };

  const deleteComment = (commentId: string) => {
    const ok = window.confirm(t("Delete this comment? (Replies will also be deleted)"));
    if (!ok) return;
    startTransition(async () => {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (res.status === 401) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) {
        setError(data?.error || t("Failed to delete comment"));
        return;
      }
      setComments((prev) => removeFromTree(prev, commentId));
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
        setError(data?.error || t("Failed to update comment"));
        return;
      }
      setInfo(hide ? t("Comment hidden") : t("Comment shown again"));
      await refreshComments({ force: true });
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
        setError(data?.error || t("Failed to pin comment"));
        return;
      }
      setInfo(pin ? t("Comment pinned") : t("Comment unpinned"));
      await refreshComments({ force: true });
    });
  };

  const submitReport = (commentId: string) => {
    setError(null);
    setInfo(null);
    setUnauthorized(false);
    const reason = reportReason.trim();
    if (!reason) {
      setError("A report reason is required");
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
        setError(data?.error || "Failed to send report");
        return;
      }
      setInfo(t("Report sent. Thank you!"));
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

  const toggleReportPanel = (commentId: string) => {
    setReportFor((prev) => (prev === commentId ? null : commentId));
    setReportReason("");
    setError(null);
    setInfo(null);
    setReplyTo(null);
    setReplyText("");
    setEditingId(null);
    setEditingText("");
  };

  const cancelReportPanel = () => {
    setReportFor(null);
    setReportReason("");
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
            onClick={() => {
              setError(null);
              setInfo(null);
              refreshComments();
            }}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
            title="Refresh"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-4">
        {allowCompose ? (
          <CommentComposer
            textareaRef={composer.textareaRef}
            text={composer.text}
            setText={composer.setText}
            files={composer.files}
            onPickFiles={composer.onPickFiles}
            removeFileAt={composer.removeFileAt}
            applyHidden={composer.applyHidden}
            insertLink={composer.insertLink}
            submit={composer.submit}
            isPending={isPending}
            filesLimit={composer.filesLimit}
          />
        ) : null}

        {unauthorized || info || error ? (
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
            {unauthorized ? (
              <span>
                You are not signed in yet.{" "}
                <Link
                  className="font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`}
                >
                  Sign in
                </Link>
              </span>
            ) : null}
            {info ? (
              <span className={unauthorized ? "ml-2 text-emerald-700 dark:text-emerald-400" : "text-emerald-700 dark:text-emerald-400"}>
                {info}
              </span>
            ) : null}
            {error ? (
              <span className={unauthorized || info ? "ml-2 text-red-600 dark:text-red-400" : "text-red-600 dark:text-red-400"}>
                {error}
              </span>
            ) : null}
          </div>
        ) : null}

        {allowCompose ? <hr className="my-5 border-gray-200 dark:border-gray-800" /> : null}

        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading...</p>
        ) : pretty.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">No comments yet.</p>
        ) : (
          <CommentThread
            comments={pretty}
            viewerId={viewerId}
            canModerate={canModerate}
            sectionTargetType={targetType}
            showUserRating={showUserRating}
            showChapterContext={showChapterContext}
            isPending={isPending}
            focusedId={focusedId}
            revealed={revealed}
            setRevealed={setRevealed}
            replyTo={replyTo}
            replyText={replyText}
            setReplyText={setReplyText}
            replyRef={replyRef}
            onStartReply={startReply}
            onCancelReply={cancelReply}
            onSubmitReply={submitReply}
            editingId={editingId}
            editingText={editingText}
            setEditingText={setEditingText}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSaveEdit={saveEdit}
            onDelete={deleteComment}
            reportFor={reportFor}
            reportReason={reportReason}
            setReportReason={setReportReason}
            onToggleReport={toggleReportPanel}
            onCancelReport={cancelReportPanel}
            onSubmitReport={submitReport}
            onToggleLike={toggleLikeComment}
            onToggleDislike={toggleDislikeComment}
            onTogglePin={togglePin}
            onToggleHide={toggleHide}
          />
        )}
      </div>
    </section>
  );
}
