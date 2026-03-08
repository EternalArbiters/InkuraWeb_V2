"use client";

import * as React from "react";
import { presignAndUpload } from "@/lib/r2UploadClient";
import { prepareUploadFiles, summarizePreparedUploadFiles, type PreparedUploadFile, type PreparedUploadSummary } from "@/lib/uploadOptimization";

type Page = { id: string; imageUrl: string; order: number };

type UploadSummaryState = PreparedUploadSummary & { ready: boolean };

export function useComicPagesManager({
  workId,
  chapterId,
  initialHasPages,
  initialPages,
  initialThumbnailImage,
}: {
  workId: string;
  chapterId: string;
  initialHasPages: boolean;
  initialPages: Page[];
  initialThumbnailImage: string | null;
}) {
  const [files, setFiles] = React.useState<File[]>([]);
  const [preparedFiles, setPreparedFiles] = React.useState<PreparedUploadFile[]>([]);
  const [preparingFiles, setPreparingFiles] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [pages, setPages] = React.useState<Page[]>(initialPages);
  const [thumbnailImage, setThumbnailImage] = React.useState<string | null>(initialThumbnailImage);

  // Default ON if chapter already has pages to prevent accidental duplicate accumulation.
  const [replaceExisting, setReplaceExisting] = React.useState<boolean>(initialHasPages);

  React.useEffect(() => {
    if (!files.length) {
      setPreparedFiles([]);
      setPreparingFiles(false);
      return;
    }

    let cancelled = false;
    setPreparingFiles(true);
    void prepareUploadFiles({ scope: "pages", files }).then((prepared) => {
      if (cancelled) return;
      setPreparedFiles(prepared);
      setPreparingFiles(false);
    });

    return () => {
      cancelled = true;
    };
  }, [files]);

  const uploadSummary = React.useMemo<UploadSummaryState | null>(() => {
    if (!files.length) return null;
    const originalBytes = files.reduce((total, file) => total + file.size, 0);
    if (preparedFiles.length !== files.length) {
      return {
        count: files.length,
        originalBytes,
        optimizedBytes: originalBytes,
        bytesSaved: 0,
        compressedCount: 0,
        ready: false,
      };
    }
    return {
      ...summarizePreparedUploadFiles(preparedFiles),
      ready: true,
    };
  }, [files, preparedFiles]);

  async function upload() {
    if (!files.length) return;
    setErr(null);
    setLoading(true);
    try {
      if (replaceExisting && pages.length > 0) {
        const ok = confirm(
          "Replace all existing pages? This will delete the current pages (and their R2 files) before saving the new ones."
        );
        if (!ok) {
          setLoading(false);
          return;
        }
      }

      const activePreparedFiles =
        preparedFiles.length === files.length ? preparedFiles : await prepareUploadFiles({ scope: "pages", files });

      const startOrder = replaceExisting ? 0 : pages.length;
      const uploaded = [] as { url: string; key: string; order: number }[];

      for (let i = 0; i < activePreparedFiles.length; i++) {
        const prepared = activePreparedFiles[i];
        const up = await presignAndUpload({
          scope: "pages",
          file: prepared.originalFile,
          preparedFile: prepared,
          workId,
          chapterId,
          optimizationVersion: "pr3-comic-page-opt-v1",
        });
        uploaded.push({ url: up.url, key: up.key, order: startOrder + i + 1 });
      }

      const res = await fetch(`/api/studio/chapters/${chapterId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replace: replaceExisting, pages: uploaded }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Commit failed");

      const nextPages: Page[] = uploaded.map((item, index) => ({
        id: String(json?.pages?.[index]?.id || `temp:${Date.now()}:${index}`),
        imageUrl: item.url,
        order: item.order,
      }));

      setPages((prev) => (replaceExisting ? nextPages : [...prev, ...nextPages]));
      setFiles([]);
      setPreparedFiles([]);
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
      setThumbnailImage(url);
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
      setThumbnailImage(null);
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
      setPages((prev) => prev.filter((page) => page.id !== pageId).map((page, index) => ({ ...page, order: index + 1 })));
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return {
    files,
    setFiles,
    preparedFiles,
    preparingFiles,
    uploadSummary,
    loading,
    err,
    pages,
    thumbnailImage,
    replaceExisting,
    setReplaceExisting,
    upload,
    setThumb,
    clearThumb,
    del,
  };
}
