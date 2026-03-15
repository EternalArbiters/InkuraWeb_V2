"use client";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

import * as React from "react";
import { ArrowDown, ArrowUp, FileArchive, FileText, ImagePlus, Images, Trash2, X } from "lucide-react";
import { importComicPagesFromPdf, importComicPagesFromZip, sortComicPageFiles } from "@/lib/comicPageImports";

type UploadMode = "manual" | "all" | "zip" | "pdf";

type Props = {
  files: File[];
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onBusyChange?: (busy: boolean) => void;
};

type PreviewFile = {
  id: string;
  file: File;
  url: string;
};

const MODE_COPY: Record<
  UploadMode,
  {
    label: string;
    description: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  manual: {
    label: "Manual one by one",
    description: "",
    Icon: ImagePlus,
  },
  all: {
    label: "Upload all images",
    description: "",
    Icon: Images,
  },
  zip: {
    label: "Upload chapter ZIP",
    description: "",
    Icon: FileArchive,
  },
  pdf: {
    label: "Upload chapter PDF",
    description: "",
    Icon: FileText,
  },
};

function formatBytes(bytes: number) {
  const t = useUILanguageText();
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return items;
  const next = [...items];
  const [picked] = next.splice(from, 1);
  next.splice(to, 0, picked);
  return next;
}

function normalizeImageFiles(files: File[]) {
  return sortComicPageFiles(
    files.filter((file) => {
      const type = String(file.type || "").toLowerCase();
      return type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name);
    })
  );
}

export default function ComicPageFilesPicker({ files, setFiles, onBusyChange }: Props) {
  const [mode, setMode] = React.useState<UploadMode>("all");
  const [importError, setImportError] = React.useState<string | null>(null);
  const [importNote, setImportNote] = React.useState<string | null>(null);
  const [importing, setImporting] = React.useState(false);
  const manualInputRef = React.useRef<HTMLInputElement | null>(null);
  const allInputRef = React.useRef<HTMLInputElement | null>(null);
  const zipInputRef = React.useRef<HTMLInputElement | null>(null);
  const pdfInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    onBusyChange?.(importing);
  }, [importing, onBusyChange]);

  const previewFiles = React.useMemo<PreviewFile[]>(() => {
    return files.map((file, index) => ({
      id: `${file.name}:${file.size}:${index}`,
      file,
      url: URL.createObjectURL(file),
    }));
  }, [files]);

  React.useEffect(() => {
    return () => {
      previewFiles.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previewFiles]);

  const totalBytes = React.useMemo(() => files.reduce((sum, file) => sum + file.size, 0), [files]);

  function appendManualFiles(fileList: FileList | null) {
    const incoming = normalizeImageFiles(Array.from(fileList || []));
    if (!incoming.length) {
      setImportError("Select valid image files for comic pages.");
      return;
    }
    setImportError(null);
    setImportNote(`${incoming.length} images added to the page queue.`);
    setFiles((prev) => [...prev, ...incoming]);
  }

  function replaceWithAllImages(fileList: FileList | null) {
    const incoming = normalizeImageFiles(Array.from(fileList || []));
    if (!incoming.length) {
      setImportError("Select valid image files for comic pages.");
      return;
    }
    setImportError(null);
    setImportNote(`${incoming.length} images ready to upload.`);
    setFiles(incoming);
  }

  async function importArchive(kind: "zip" | "pdf", file: File | null) {
    if (!file) return;
    setImportError(null);
    setImportNote(kind === "zip" ? "Reading ZIP file..." : "Converting PDF into image pages...");
    setImporting(true);
    try {
      const imported = kind === "zip" ? await importComicPagesFromZip(file) : await importComicPagesFromPdf(file);
      setFiles(imported);
      setImportNote(
        kind === "zip"
          ? `${imported.length} images were extracted from the ZIP successfully.`
          : `${imported.length} PDF pages were converted to images successfully.`
      );
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Failed to process the file.");
      setImportNote(null);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(MODE_COPY) as UploadMode[]).map((key) => {
          const item = MODE_COPY[key];
          const Icon = item.Icon;
          const active = key === mode;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                setMode(key);
                setImportError(null);
                setImportNote(null);
              }}
              className={`rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30"
                  : "border-gray-200 bg-white/70 hover:border-purple-300 dark:border-gray-800 dark:bg-gray-900/40 dark:hover:border-purple-700"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl border border-current/10 bg-black/5 p-2 dark:bg-white/5">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{item.label}</div>
                  {item.description ? <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{item.description}</div> : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/40">
        {mode === "manual" ? (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => manualInputRef.current?.click()}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
              >
                Add images
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">Supported formats: JPG, PNG, WEBP, GIF, BMP, AVIF</span>
            </div>
            <input
              ref={manualInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                appendManualFiles(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </div>
        ) : null}

        {mode === "all" ? (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => allInputRef.current?.click()}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
              >
                Choose all images
              </button>
            </div>
            <input
              ref={allInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                replaceWithAllImages(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </div>
        ) : null}

        {mode === "zip" ? (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => zipInputRef.current?.click()}
                disabled={importing}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:hover:bg-gray-900"
              >
                {importing ? "Processing ZIP..." : "Choose ZIP file"}
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">Make sure the files inside the ZIP are comic page images.</span>
            </div>
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              className="hidden"
              onChange={(e) => {
                void importArchive("zip", e.target.files?.[0] || null);
                e.currentTarget.value = "";
              }}
            />
          </div>
        ) : null}

        {mode === "pdf" ? (
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={importing}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 dark:border-gray-800 dark:hover:bg-gray-900"
              >
                {importing ? "Processing PDF..." : "Choose PDF file"}
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">Ideal for chapters that already exist as PDF files.</span>
            </div>
            <input
              ref={pdfInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                void importArchive("pdf", e.target.files?.[0] || null);
                e.currentTarget.value = "";
              }}
            />
          </div>
        ) : null}
      </div>

      {importError ? <div className="rounded-2xl border border-red-200 bg-red-50/60 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">{importError}</div> : null}
      {importNote ? <div className="rounded-2xl border border-gray-200 bg-white/70 p-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-200" data-ui-language-partial="true">{importNote}</div> : null}

      <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 dark:border-gray-800 dark:bg-gray-900/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{t("Pages")}</div>
            <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">{files.length} pages • total {formatBytes(totalBytes)}</div>
          </div>
          {files.length ? (
            <button
              type="button"
              onClick={() => setFiles([])}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
            >
              <X className="h-4 w-4" />
              Clear queue
            </button>
          ) : null}
        </div>

        {previewFiles.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
            {t("There are no pages in the queue yet.")}
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            {previewFiles.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white/80 p-3 dark:border-gray-800 dark:bg-gray-950/30"
              >
                <div className="flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.file.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{item.file.name}</div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Page #{index + 1} • {formatBytes(item.file.size)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => moveItem(prev, index, index - 1))}
                    disabled={index === 0}
                    aria-label="Move page up"
                    title="Move page up"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 disabled:opacity-40 dark:border-gray-800"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => moveItem(prev, index, index + 1))}
                    disabled={index === previewFiles.length - 1}
                    aria-label="Move page down"
                    title="Move page down"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 disabled:opacity-40 dark:border-gray-800"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                    aria-label="Remove page"
                    title="Remove page"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 dark:border-red-900 dark:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
