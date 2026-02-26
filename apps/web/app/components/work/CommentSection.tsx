"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ensureCommentMedia } from "@/lib/commentMediaClient";
import { EyeOff, Image as ImageIcon, Link2, RefreshCw, ThumbsUp } from "lucide-react";

type TargetType = "WORK" | "CHAPTER";

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
  body: string;
  createdAt: string;
  editedAt?: string | null;
  isHidden?: boolean;
  isSpoiler?: boolean;
  user: CommentUser;
  attachments?: CommentAttachment[];
};

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

export default function CommentSection({
  targetType,
  targetId,
  title = "Comments",
  take = 100,
  showComposer = true,
  sort = "new",
  variant = "full",
}: {
  targetType: TargetType;
  targetId: string;
  title?: string;
  take?: number;
  showComposer?: boolean;
  sort?: "new" | "top";
  variant?: "full" | "compact";
}) {
  const router = useRouter();
  const pathname = usePathname();
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
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const qs = new URLSearchParams({ targetType, targetId, take: String(take || 100) });
      if (sort) qs.set("sort", sort);
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
  }, [targetType, targetId, take, sort]);

  const pretty = useMemo(() => {
    return comments.map((c) => ({
      ...c,
      createdAtLabel: new Date(c.createdAt).toLocaleString(),
      editedAtLabel: c.editedAt ? new Date(c.editedAt).toLocaleString() : null,
      displayName: c.user.name || c.user.username || "Unknown",
    }));
  }, [comments]);

  const onPickFiles = (picked: FileList | null) => {
    if (!picked) return;
    const arr = Array.from(picked);
    // max 3 attachments
    const merged = [...files, ...arr].slice(0, 3);
    setFiles(merged);
  };

  const removeFileAt = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = () => {
    setError(null);
    setUnauthorized(false);
    setInfo(null);
    const body = text.trim();
    if (!body) return;

    startTransition(async () => {
      try {
        // Upload attachments (dedupe-aware)
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

  const applyHidden = () => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = text;

    // If nothing selected, insert |||| and place cursor in the middle.
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
        prev.map((c) => (c.id === commentId ? { ...c, likeCount: data.likeCount, viewerLiked: data.liked } : c))
      );
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

  return (
    <section className={variant === "compact" ? "mt-6" : "mt-10"}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
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

      <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-5">
        {showComposer ? (
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px]"
              placeholder="Tulis comment..."
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
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

              <button
                type="button"
                disabled={isPending || !text.trim()}
                onClick={submit}
                className="rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
              >
                {isPending ? "Sending..." : "Send"}
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

          <div className="text-xs text-gray-600 dark:text-gray-300">
            {unauthorized ? (
              <span>
                Kamu belum login. {" "}
                <Link className="font-semibold text-purple-600 dark:text-purple-400 hover:underline" href={`/auth/signin?callbackUrl=${encodeURIComponent(pathname || "/")}`}>
                  Sign in
                </Link>
              </span>
            ) : null}
            {info ? <span className="text-emerald-700 dark:text-emerald-400">{info}</span> : null}
            {error ? <span className="text-red-600 dark:text-red-400">{error}</span> : null}
          </div>
        </div>

        <hr className="my-5 border-gray-200 dark:border-gray-800" />

        {loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading...</p>
        ) : pretty.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Belum ada comment.</p>
        ) : (
          <div className="space-y-4">
            {pretty.map((c) => {
              const hidden = (c.isHidden ?? false) as boolean;
              const spoiler = (c.isSpoiler ?? false) as boolean;
              const showSpoiler = !spoiler || revealed[c.id];
              const likeCount = typeof (c as any).likeCount === "number" ? (c as any).likeCount : 0;
              const viewerLiked = !!(c as any).viewerLiked;

              return (
                <div key={c.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{c.displayName}</div>
                    <div className="flex items-center gap-2">
                      {hidden ? (
                        <span className="px-2 py-0.5 text-[11px] font-semibold border border-amber-300/60 text-amber-700 dark:text-amber-300 dark:border-amber-500/40">
                          Hidden
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

                  {c.editedAtLabel ? <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Edited: {c.editedAtLabel}</div> : null}

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
                      onClick={() => toggleLikeComment(c.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                        viewerLiked
                          ? "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-950/25 dark:text-purple-200"
                          : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                      }`}
                      title="Like"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{likeCount}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReportFor((prev) => (prev === c.id ? null : c.id));
                        setReportReason("");
                        setError(null);
                        setInfo(null);
                      }}
                      className="rounded-full px-3 py-1 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                    >
                      Report
                    </button>

                    {canModerate ? (
                      <button
                        type="button"
                        onClick={() => toggleHide(c.id, !hidden)}
                        className="rounded-full px-3 py-1 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900"
                      >
                        {hidden ? "Unhide" : "Hide"}
                      </button>
                    ) : null}
                  </div>

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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
