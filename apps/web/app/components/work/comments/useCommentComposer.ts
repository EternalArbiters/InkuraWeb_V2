"use client";

import { useRef, useState } from "react";
import { ensureCommentMedia } from "@/lib/commentMediaClient";
import type { TargetType } from "./types";
import { isProbablyUrl, normalizeUrl } from "./textUtils";

type TransitionStarter = (cb: () => void) => void;

export type UseCommentComposerOptions = {
  targetType: TargetType;
  targetId: string;
  startTransition: TransitionStarter;
  filesLimit?: number;
  onBeforeSubmit?: () => void;
  onUnauthorized?: () => void;
  onError?: (msg: string) => void;
  onSubmitted?: () => Promise<void> | void;
};

export function useCommentComposer({
  targetType,
  targetId,
  startTransition,
  filesLimit = 3,
  onBeforeSubmit,
  onUnauthorized,
  onError,
  onSubmitted,
}: UseCommentComposerOptions) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const onPickFiles = (picked: FileList | null) => {
    if (!picked) return;
    const arr = Array.from(picked);
    const merged = [...files, ...arr].slice(0, filesLimit);
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
    onBeforeSubmit?.();
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
          onUnauthorized?.();
          return;
        }
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) {
          onError?.(data?.error || "Failed to send comment");
          return;
        }

        setText("");
        setFiles([]);
        await onSubmitted?.();
      } catch (e: any) {
        const msg = e?.message || "Failed to send comment";
        if (String(msg).toLowerCase().includes("unauthorized")) {
          onUnauthorized?.();
          return;
        }
        onError?.(msg);
      }
    });
  };

  return {
    textareaRef,
    text,
    setText,
    files,
    onPickFiles,
    removeFileAt,
    applyHidden,
    insertLink,
    submit,
    filesLimit,
  };
}
