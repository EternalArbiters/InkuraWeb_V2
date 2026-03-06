"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { presignAndUpload } from "@/lib/r2UploadClient";

export function useComicPagesManager({
  workId,
  chapterId,
  initialHasPages,
}: {
  workId: string;
  chapterId: string;
  initialHasPages: boolean;
}) {
  const router = useRouter();

  const [files, setFiles] = React.useState<File[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Default ON if chapter already has pages to prevent accidental duplicate accumulation.
  const [replaceExisting, setReplaceExisting] = React.useState<boolean>(initialHasPages);

  async function upload(existingPagesCount: number) {
    if (!files.length) return;
    setErr(null);
    setLoading(true);
    try {
      if (replaceExisting && existingPagesCount > 0) {
        const ok = confirm(
          "Replace all existing pages? This will delete the current pages (and their R2 files) before saving the new ones."
        );
        if (!ok) {
          setLoading(false);
          return;
        }
      }

      const startOrder = replaceExisting ? 0 : existingPagesCount;
      const uploaded = [] as { url: string; key: string; order: number }[];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const up = await presignAndUpload({ scope: "pages", file, workId, chapterId });
        uploaded.push({ url: up.url, key: up.key, order: startOrder + i + 1 });
      }

      const res = await fetch(`/api/studio/chapters/${chapterId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replace: replaceExisting, pages: uploaded }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Commit failed");

      setFiles([]);
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function setThumb(url: string) {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/chapters/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnailImage: url, thumbnailKey: null }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(json?.error || "Failed");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function clearThumb() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/chapters/${chapterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnailImage: null, thumbnailKey: null }),
      });
      const json = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(json?.error || "Failed");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function del(pageId: string) {
    if (!confirm("Delete this page?")) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/studio/comic-pages/${pageId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Delete failed");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return {
    files,
    setFiles,
    loading,
    err,
    replaceExisting,
    setReplaceExisting,
    upload,
    setThumb,
    clearThumb,
    del,
  };
}
