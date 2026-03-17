"use client";

import * as React from "react";
import { Paperclip, RefreshCcw, Send, X } from "lucide-react";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import { dispatchNavBadgeRefresh } from "@/app/components/navBadgeEvents";
import { presignAndUpload } from "@/lib/r2UploadClient";

const MAX_ATTACHMENTS = 4;
const ACCEPTED_ATTACHMENT_TYPES = "image/png,image/jpeg,image/webp,application/pdf";

type ReportAttachment = {
  id: string;
  filename: string;
  key: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  kind: "IMAGE" | "FILE";
  createdAt?: string;
};

type ReportRow = {
  id: string;
  title: string;
  message: string;
  pageUrl: string | null;
  status: string;
  createdAt: string;
  reporterReadAt?: string | null;
  adminReadAt?: string | null;
  reporter?: { id: string; name: string | null; username: string | null; email: string; image: string | null };
  attachments?: ReportAttachment[];
};

type PendingAttachment = {
  id: string;
  file: File;
  previewUrl: string | null;
  kind: "IMAGE" | "FILE";
};

function normalizeAttachmentKind(file: File): "IMAGE" | "FILE" {
  return String(file.type || "").toLowerCase().startsWith("image/") ? "IMAGE" : "FILE";
}

function inferAttachmentContentType(file: File) {
  const explicit = String(file.type || "").trim().toLowerCase();
  if (explicit) return explicit;
  const name = String(file.name || "").toLowerCase();
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function fileInputToPendingAttachments(fileList: FileList | null) {
  if (!fileList?.length) return [] as PendingAttachment[];
  return Array.from(fileList).map((file) => {
    const kind = normalizeAttachmentKind(file);
    return {
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      previewUrl: kind === "IMAGE" ? URL.createObjectURL(file) : null,
      kind,
    } satisfies PendingAttachment;
  });
}

function AttachmentPreview({ attachment }: { attachment: ReportAttachment }) {
  if (attachment.kind === "IMAGE") {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={attachment.url} alt={attachment.filename} className="block h-auto max-h-[220px] w-auto max-w-[220px] object-contain" />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="flex min-w-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:hover:bg-gray-900"
    >
      <Paperclip className="h-4 w-4 shrink-0" />
      <span className="min-w-0 truncate">{attachment.filename}</span>
      <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">{formatBytes(attachment.sizeBytes)}</span>
    </a>
  );
}

export default function AdminReportClient({ initialIsAdmin }: { initialIsAdmin: boolean }) {
  const t = useUILanguageText("Page Admin Report");
  const tShared = useUILanguageText("Shared Components");
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<ReportRow[]>([]);
  const [isAdmin, setIsAdmin] = React.useState(initialIsAdmin);

  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pageUrl, setPageUrl] = React.useState("");
  const [attachments, setAttachments] = React.useState<PendingAttachment[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const attachmentsRef = React.useRef<PendingAttachment[]>([]);

  React.useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  React.useEffect(() => {
    return () => {
      attachmentsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin-report");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || t("Failed to load reports"));
      setRows(Array.isArray(json?.reports) ? json.reports : []);
      setIsAdmin(!!json?.isAdmin);
    } catch (e: any) {
      setErr(e?.message || tShared("Error"));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function removeAttachment(id: string) {
    setAttachments((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function clearPendingAttachments() {
    setAttachments((current) => {
      current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      return [];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onPickAttachments(event: React.ChangeEvent<HTMLInputElement>) {
    const incoming = fileInputToPendingAttachments(event.target.files);
    if (!incoming.length) return;

    setAttachments((current) => {
      const next = [...current, ...incoming];
      if (next.length <= MAX_ATTACHMENTS) return next;

      const allowed = next.slice(0, MAX_ATTACHMENTS);
      const rejected = next.slice(MAX_ATTACHMENTS);
      rejected.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
      setErr(t("You can attach up to 4 files."));
      return allowed;
    });

    event.target.value = "";
  }

  async function submit() {
    setErr(null);
    setOkMsg(null);
    if (!title.trim()) return setErr(t("Title is required."));
    if (!message.trim()) return setErr(t("Message is required."));

    setLoading(true);
    try {
      const uploadedAttachments = [] as Array<{
        filename: string;
        key: string;
        contentType: string;
        sizeBytes: number;
        kind: "IMAGE" | "FILE";
      }>;

      for (const attachment of attachments) {
        const uploaded = await presignAndUpload({
          scope: "admin_report_attachments",
          file: attachment.file,
        });
        uploadedAttachments.push({
          filename: attachment.file.name,
          key: uploaded.key,
          contentType: inferAttachmentContentType(attachment.file),
          sizeBytes: attachment.file.size,
          kind: attachment.kind,
        });
      }

      const res = await fetch("/api/admin-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          pageUrl: pageUrl.trim() || null,
          attachments: uploadedAttachments,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || t("Failed to send report"));
      setOkMsg(t("Sent!"));
      setTitle("");
      setMessage("");
      setPageUrl("");
      clearPendingAttachments();
      await load();
      dispatchNavBadgeRefresh("/api/admin-report/unread-count");
    } catch (e: any) {
      setErr(e?.message || tShared("Error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 grid gap-4">
      {err ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-sm dark:border-red-900 dark:bg-red-950/40">{err}</div>
      ) : null}
      {okMsg ? (
        <div className="rounded-2xl border border-green-200 bg-green-50/60 p-4 text-sm dark:border-green-900 dark:bg-green-950/40">{okMsg}</div>
      ) : null}

      {!isAdmin ? (
        <div className="grid gap-3 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="text-sm font-semibold">{t("Send a report to the admin")}</div>
          <div className="grid gap-1">
            <label className="text-sm font-semibold">{t("Title")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
              placeholder={t("Example: Login bug, chapter cannot be opened, etc.")}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-semibold">{t("Message")}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
              placeholder={t("Explain the issue and the steps to reproduce it.")}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-semibold">{t("Link (optional)")}</label>
            <input
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-950"
              placeholder="https://inkura.../work/xxx"
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <label className="text-sm font-semibold">{t("Attachments")}</label>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {attachments.length}/{MAX_ATTACHMENTS}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
                <Paperclip className="h-4 w-4" />
                <span>{t("Add attachment")}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={ACCEPTED_ATTACHMENT_TYPES}
                  multiple
                  onChange={onPickAttachments}
                />
              </label>
              {attachments.length ? (
                <button
                  type="button"
                  onClick={clearPendingAttachments}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
                >
                  <X className="h-4 w-4" />
                  <span>{t("Clear attachments")}</span>
                </button>
              ) : null}
            </div>
            {attachments.length ? (
              <div className="flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950"
                  >
                    {attachment.kind === "IMAGE" && attachment.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={attachment.previewUrl} alt={attachment.file.name} className="block h-auto max-h-[160px] w-auto max-w-[160px] object-contain" />
                    ) : (
                      <div className="flex max-w-[220px] items-center gap-2 px-3 py-2 text-sm">
                        <Paperclip className="h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{attachment.file.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{formatBytes(attachment.file.size)}</div>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-90 transition hover:bg-black"
                      aria-label={t("Remove attachment")}
                      title={t("Remove attachment")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-3 font-semibold text-white hover:brightness-110 disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? t("Sending...") : t("Send")}</span>
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{isAdmin ? t("Inbox reports") : t("My reports")}</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">Latest 100</div>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>{loading ? t("Refreshing...") : t("Refresh")}</span>
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {rows.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">{t("No reports yet.")}</div>
          ) : (
            rows.map((r) => {
              const unread = isAdmin ? !r.adminReadAt : false;
              return (
                <div
                  key={r.id}
                  className={
                    "rounded-2xl border p-4 transition " +
                    (unread
                      ? "border-purple-200 bg-purple-50/60 dark:border-purple-900 dark:bg-purple-950/30"
                      : "border-gray-200 bg-white/60 dark:border-gray-800 dark:bg-gray-900/40")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={(unread ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200") + " break-words font-semibold"}>
                        {r.title}
                      </div>
                      <div className={(unread ? "" : "opacity-70") + " mt-1 text-xs text-gray-600 dark:text-gray-300"}>
                        {new Date(r.createdAt).toLocaleString()} • {r.status}
                        {isAdmin && r.reporter ? <> • {r.reporter.username || r.reporter.name || r.reporter.email}</> : null}
                      </div>
                    </div>
                  </div>
                  <div className={(unread ? "" : "text-gray-600 dark:text-gray-300") + " mt-3 whitespace-pre-wrap break-words text-sm"}>{r.message}</div>
                  {r.pageUrl ? (
                    <div className="mt-2 text-sm">
                      <a className="break-all text-blue-600 hover:underline dark:text-blue-400" href={r.pageUrl} target="_blank" rel="noreferrer">
                        {r.pageUrl}
                      </a>
                    </div>
                  ) : null}
                  {Array.isArray(r.attachments) && r.attachments.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.attachments.map((attachment) => (
                        <AttachmentPreview key={attachment.id} attachment={attachment} />
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
