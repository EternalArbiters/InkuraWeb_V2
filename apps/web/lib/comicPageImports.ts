"use client";

const ZIP_CDN_URL = "https://unpkg.com/jszip@3.10.1/dist/jszip.min.js";
const PDFJS_CDN_URL = "https://unpkg.com/pdfjs-dist@4.9.124/build/pdf.min.mjs";
const PDFJS_WORKER_CDN_URL = "https://unpkg.com/pdfjs-dist@4.9.124/build/pdf.worker.min.mjs";

type ZipEntry = {
  name: string;
  dir: boolean;
  async(type: "blob"): Promise<Blob>;
};

type JSZipLike = {
  files: Record<string, ZipEntry>;
};

type JSZipStatic = {
  loadAsync(data: ArrayBuffer): Promise<JSZipLike>;
};

type PdfJsPage = {
  getViewport(params: { scale: number }): { width: number; height: number };
  render(params: {
    canvasContext: CanvasRenderingContext2D;
    viewport: { width: number; height: number };
    background?: string;
  }): { promise: Promise<void> };
  cleanup(): void;
};

type PdfJsDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfJsPage>;
  cleanup(): void;
  destroy(): void;
};

type PdfJsModule = {
  GlobalWorkerOptions?: { workerSrc?: string };
  getDocument(params: { data: Uint8Array }): { promise: Promise<PdfJsDocument> };
};

declare global {
  interface Window {
    JSZip?: JSZipStatic;
  }
}

const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|bmp|avif)$/i;

function isImageFilename(name: string) {
  return IMAGE_EXT_RE.test(name);
}

function sanitizeBaseName(name: string) {
  return String(name || "page")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9._-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .toLowerCase();
}

function basename(name: string) {
  const normalized = String(name || "").replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts[parts.length - 1] || normalized;
}

function contentTypeFromFilename(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".bmp")) return "image/bmp";
  if (lower.endsWith(".avif")) return "image/avif";
  return "application/octet-stream";
}

const NATURAL_COLLATOR = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export function sortComicPageFiles<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => NATURAL_COLLATOR.compare(a.name, b.name));
}

function loadScriptOnce(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window is unavailable"));
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[data-external-src="${src}"]`);
    if (existing?.dataset.ready === "true") {
      resolve();
      return;
    }

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.externalSrc = src;
    script.addEventListener(
      "load",
      () => {
        script.dataset.ready = "true";
        resolve();
      },
      { once: true }
    );
    script.addEventListener("error", () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

async function loadJsZip(): Promise<JSZipStatic> {
  if (typeof window === "undefined") throw new Error("Window is unavailable");
  if (!window.JSZip) {
    await loadScriptOnce(ZIP_CDN_URL);
  }
  if (!window.JSZip) throw new Error("JSZip failed to load in the browser");
  return window.JSZip;
}

let pdfJsPromise: Promise<PdfJsModule> | null = null;
let externalModuleImporter: ((specifier: string) => Promise<any>) | null = null;

function getExternalModuleImporter() {
  if (!externalModuleImporter) {
    externalModuleImporter = new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<any>;
  }
  return externalModuleImporter;
}

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfJsPromise) {
    const importExternalModule = getExternalModuleImporter();
    pdfJsPromise = importExternalModule(PDFJS_CDN_URL).then((mod: any) => {
      const pdfjs = (mod?.default || mod) as PdfJsModule;
      if (pdfjs?.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN_URL;
      }
      return pdfjs;
    });
  }
  return pdfJsPromise;
}

function blobToFile(blob: Blob, filename: string, fallbackType: string) {
  return new File([blob], filename, {
    type: blob.type || fallbackType,
    lastModified: Date.now(),
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create the rendered image"));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

export async function importComicPagesFromZip(zipFile: File): Promise<File[]> {
  const JSZip = await loadJsZip();
  const archive = await JSZip.loadAsync(await zipFile.arrayBuffer());
  const entries = Object.values(archive.files)
    .filter((entry) => !entry.dir && isImageFilename(entry.name))
    .sort((a, b) => NATURAL_COLLATOR.compare(a.name, b.name));

  if (!entries.length) {
    throw new Error("The ZIP does not contain supported image files");
  }

  const files: File[] = [];
  for (const entry of entries) {
    const blob = await entry.async("blob");
    files.push(blobToFile(blob, basename(entry.name), contentTypeFromFilename(entry.name)));
  }
  return files;
}

export async function importComicPagesFromPdf(pdfFile: File): Promise<File[]> {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({ data: new Uint8Array(await pdfFile.arrayBuffer()) });
  const pdf = await task.promise;
  const baseName = sanitizeBaseName(pdfFile.name) || "chapter";
  const files: File[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      try {
        const baseViewport = page.getViewport({ scale: 1 });
        const maxEdge = Math.max(baseViewport.width, baseViewport.height);
        const scale = Math.max(1.5, Math.min(2.2, 2200 / Math.max(1, maxEdge)));
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas 2D context is unavailable");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport, background: "#ffffff" }).promise;
        const blob = await canvasToBlob(canvas, "image/webp", 0.92);
        files.push(
          blobToFile(
            blob,
            `${baseName}-page-${String(pageNumber).padStart(3, "0")}.webp`,
            "image/webp"
          )
        );
      } finally {
        page.cleanup();
      }
    }
  } finally {
    pdf.cleanup();
    pdf.destroy();
  }

  if (!files.length) {
    throw new Error("The PDF did not produce any image pages");
  }

  return files;
}
