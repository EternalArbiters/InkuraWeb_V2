"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Check,
  CornerDownRight,
  Eye,
  EyeOff,
  Flag,
  Pencil,
  SendHorizonal,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Pin,
  X,
} from "lucide-react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import type { DecoratedComment, ReplyTarget, TargetType } from "./types";
import CommentBody from "./CommentBody";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

export type CommentCardProps = {
  comment: DecoratedComment;
  depth: number;

  viewerId?: string;
  canModerate: boolean;

  sectionTargetType: TargetType;
  showUserRating: boolean;
  showChapterContext?: boolean;

  isPending: boolean;

  focusedId: string | null;

  revealed: Record<string, boolean>;
  setRevealed: Dispatch<SetStateAction<Record<string, boolean>>>;

  replyTo: ReplyTarget | null;
  replyText: string;
  setReplyText: (v: string) => void;
  replyRef: RefObject<HTMLTextAreaElement | null>;
  onStartReply: (c: DecoratedComment) => void;
  onCancelReply: () => void;
  onSubmitReply: () => void;

  editingId: string | null;
  editingText: string;
  setEditingText: (v: string) => void;
  onStartEdit: (commentId: string, currentBody: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;

  reportFor: string | null;
  reportReason: string;
  setReportReason: (v: string) => void;
  onToggleReport: (commentId: string) => void;
  onCancelReport: () => void;
  onSubmitReport: (commentId: string) => void;

  onToggleLike: (commentId: string) => void;
  onToggleDislike: (commentId: string) => void;
  onTogglePin: (commentId: string, pin: boolean) => void;
  onToggleHide: (commentId: string, hide: boolean) => void;
  variant?: "full" | "compact" | "plain";
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function CommentCard(props: CommentCardProps) {
  const {
    comment: c,
    depth,
    viewerId,
    canModerate,
    sectionTargetType,
    showUserRating,
    showChapterContext,
    isPending,
    focusedId,
    revealed,
    setRevealed,
    replyTo,
    replyText,
    setReplyText,
    replyRef,
    onStartReply,
    onCancelReply,
    onSubmitReply,
    editingId,
    editingText,
    setEditingText,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onDelete,
    reportFor,
    reportReason,
    setReportReason,
    onToggleReport,
    onCancelReport,
    onSubmitReport,
    onToggleLike,
    onToggleDislike,
    onTogglePin,
    onToggleHide,
    variant = "full",
  } = props;

  const t = useUILanguageText("Page Comments");

  const hidden = (c.isHidden ?? false) as boolean;
  const spoiler = (c.isSpoiler ?? false) as boolean;
  const showSpoiler = !spoiler || revealed[c.id];

  const likeCount = typeof c.likeCount === "number" ? c.likeCount : 0;
  const dislikeCount = typeof c.dislikeCount === "number" ? c.dislikeCount : 0;
  const viewerLiked = !!c.viewerLiked;
  const viewerDisliked = !!c.viewerDisliked;
  const isMine = !!viewerId && c.user?.id === viewerId;
  const isAdminComment = String(c.user?.role || "").toUpperCase() === "ADMIN";

  const isPinned = depth === 0 && !!(c as any).isPinned;
  const isFocused = focusedId === c.id;

  const isReplyingHere = replyTo?.id === c.id;
  const replyCount = Array.isArray(c.replies) ? c.replies.length : 0;
  const [showReplies, setShowReplies] = useState(isFocused);

  const chapterContextLabel = useMemo(() => {
    if (!showChapterContext || !c.chapter) return null;
    const chapterNumber = Number(c.chapter.number ?? 0);
    const chapterPrefix = c.chapter.label?.trim()
      ? c.chapter.label.trim()
      : Number.isFinite(chapterNumber)
        ? `${t("Chapter")} ${chapterNumber}`
        : t("Chapter");
    const chapterTitle = String(c.chapter.title || "").trim();
    return chapterTitle ? `${chapterPrefix}: ${chapterTitle}` : chapterPrefix;
  }, [c.chapter, showChapterContext, t]);


  const useCommentCard = variant === "full";
  const wrapperClassName = useCommentCard
    ? `rounded-xl border px-4 py-3 ${
        depth > 0 ? "bg-white/60 dark:bg-gray-950/80" : "bg-white dark:bg-gray-950"
      } ${
        isPinned
          ? "border-purple-300/70 dark:border-purple-500/40 ring-2 ring-purple-500/20"
          : "border-gray-200 dark:border-gray-800"
      } ${isFocused ? "ring-2 ring-amber-400/40" : ""}`
    : `${depth === 0 ? "py-5" : "py-4 pl-4"} ${
        isPinned && depth === 0
          ? "border-l-2 border-purple-400/70 dark:border-purple-500/60"
          : ""
      } ${isFocused ? "rounded-xl bg-amber-50/40 ring-1 ring-amber-400/30 dark:bg-amber-950/10" : ""}`;
  const repliesContainerClassName = useCommentCard
    ? "mt-3 space-y-3 border-l border-gray-200 pl-3 dark:border-gray-800"
    : "mt-3 space-y-0 border-l border-gray-200 pl-4 dark:border-gray-800";

  const ratingStars = useMemo(() => {
    if (!(showUserRating && sectionTargetType === "WORK")) return null;
    const raw = (c as any).userRating;
    if (typeof raw !== "number") return null;
    const v = clamp(Number(raw), 0, 5);
    return (
      <div className="mt-0.5 flex items-center gap-1 text-xs text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5" fill={i < v ? "currentColor" : "none"} />
        ))}
        <span className="ml-1 text-gray-600 dark:text-gray-300">{v}/5</span>
      </div>
    );
  }, [c, sectionTargetType, showUserRating]);

  return (
    <div
      id={`comment-${c.id}`}
      className={wrapperClassName}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            {c.user?.username ? (
              <Link href={`/u/${c.user.username}`} className="min-w-0 truncate text-sm font-semibold hover:text-purple-400">
                {c.displayName}
              </Link>
            ) : (
              <div className="min-w-0 truncate text-sm font-semibold">{c.displayName}</div>
            )}
            {isAdminComment ? (
              <span className="shrink-0 rounded-full border border-emerald-300/60 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/25 dark:text-emerald-300">
                Admin
              </span>
            ) : null}
          </div>
          {ratingStars}
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

      {chapterContextLabel ? (
        <div className="mt-1 text-[11px] font-medium text-purple-700 dark:text-purple-300">
          {t("From")} {chapterContextLabel}
        </div>
      ) : null}

            {hidden ? (
        <p className="mt-2 text-sm whitespace-pre-line text-gray-500 dark:text-gray-400">
          (This comment has been hidden by a moderator)
        </p>
      ) : spoiler && !showSpoiler ? (
        <button
          type="button"
          onClick={() => setRevealed((prev) => ({ ...prev, [c.id]: true }))}
          className="mt-2 w-full text-left rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 px-3 py-2 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          <span className="inline-flex items-center gap-2">
            <EyeOff className="h-3.5 w-3.5" />
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
              onClick={onCancelEdit}
              className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
              aria-label="Cancel edit"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              disabled={isPending || !editingText.trim()}
              onClick={() => onSaveEdit(c.id)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
              aria-label="Save edit"
              title="Save"
            >
              <Check className="h-3.5 w-3.5" />
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
              <img src={a.media.url} alt={a.type} className="max-w-[240px] max-h-[240px] object-contain block" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleLike(c.id)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
            viewerLiked
              ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-950/25 dark:text-purple-200"
              : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
          }`}
          title="Like"
          aria-label="Like"
        >
          <span className="inline-flex items-center gap-1.5">
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>{likeCount}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => onToggleDislike(c.id)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
            viewerDisliked
              ? "border-gray-500/40 bg-gray-100 text-gray-900 dark:border-gray-400/30 dark:bg-gray-900/50 dark:text-gray-100"
              : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
          }`}
          title="Dislike"
          aria-label="Dislike"
        >
          <span className="inline-flex items-center gap-1.5">
            <ThumbsDown className="h-3.5 w-3.5" />
            <span>{dislikeCount}</span>
          </span>
        </button>

        {!hidden ? (
          <button
            type="button"
            onClick={() => onStartReply(c)}
            className={`inline-flex items-center justify-center h-8 w-8 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-900 ${
              isReplyingHere
                ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-950/25 dark:text-purple-200"
                : "border-gray-300 dark:border-gray-700"
            }`}
            title="Reply"
            aria-label="Reply"
          >
            <CornerDownRight className="h-3.5 w-3.5" />
          </button>
        ) : null}

        {isMine ? (
          <>
            <button
              type="button"
              onClick={() => onStartEdit(c.id, c.body)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
              title="Edit"
              aria-label="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(c.id)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => onToggleReport(c.id)}
          className={`inline-flex items-center justify-center h-8 w-8 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-900 ${
            reportFor === c.id
              ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-950/25 dark:text-purple-200"
              : "border-gray-300 dark:border-gray-700"
          }`}
          title="Report"
          aria-label="Report"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>

        {canModerate && depth === 0 && !hidden ? (
          <button
            type="button"
            onClick={() => onTogglePin(c.id, !isPinned)}
            className={`inline-flex items-center justify-center h-8 w-8 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-900 ${
              isPinned
                ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-950/25 dark:text-purple-200"
                : "border-gray-300 dark:border-gray-700"
            }`}
            title={isPinned ? "Unpin" : "Pin"}
            aria-label={isPinned ? "Unpin" : "Pin"}
          >
            <Pin className="h-3.5 w-3.5" />
          </button>
        ) : null}

        {canModerate ? (
          <button
            type="button"
            onClick={() => onToggleHide(c.id, !hidden)}
            className={`inline-flex items-center justify-center h-8 w-8 rounded-full border hover:bg-gray-50 dark:hover:bg-gray-900 ${
              hidden
                ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/25 dark:text-amber-200"
                : "border-gray-300 dark:border-gray-700"
            }`}
            title={hidden ? "Unhide" : "Hide"}
            aria-label={hidden ? "Unhide" : "Hide"}
          >
            {hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
        ) : null}
      </div>

      {!hidden && replyCount > 0 ? (
        <button
          type="button"
          onClick={() => setShowReplies((prev) => !prev)}
          className="mt-2 inline-flex text-[11px] font-semibold text-purple-600 transition hover:text-purple-500 dark:text-purple-300 dark:hover:text-purple-200"
        >
          {showReplies ? `${t("Hide reply")} (${replyCount})` : `${t("See reply")} (${replyCount})`}
        </button>
      ) : null}

      {isReplyingHere ? (
        <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            {t("Reply to")} <span className="text-purple-700 dark:text-purple-300">{replyTo?.displayName}</span>
          </div>
          <textarea
            ref={replyRef}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={t("Write a reply...")}
            className="mt-2 w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
          />
          <div className="mt-2 flex items-center justify-between">
            <div className="text-[11px] text-gray-600 dark:text-gray-300">
              {t("Tip: you can hide text with ||like this||")}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCancelReply}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                aria-label={t("Cancel reply")}
                title={t("Cancel reply")}
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                disabled={isPending || !replyText.trim()}
                onClick={onSubmitReply}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
                aria-label={t("Send reply")}
                title={t("Send reply")}
              >
                <SendHorizonal className={`h-3.5 w-3.5 ${isPending ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {reportFor === c.id ? (
        <div className="mt-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-3">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">{t("Report reason")}</div>
          <input
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder={t("Example: spam, hate speech, harassment...")}
            className="mt-2 w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500 text-sm"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancelReport}
              className="rounded-full px-3 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isPending || !reportReason.trim()}
              onClick={() => onSubmitReport(c.id)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
            >
              {isPending ? "Sending..." : "Submit"}
            </button>
          </div>
        </div>
      ) : null}

      {showReplies && Array.isArray(c.replies) && c.replies.length ? (
        <div className={repliesContainerClassName}>
          {c.replies.map((r) => (
            <CommentCard
              key={r.id}
              {...props}
              comment={r}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
