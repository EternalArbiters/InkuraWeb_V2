"use client";

import { markFileAsPreOptimized } from "@/lib/uploadOptimization";

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

type PdfJsOperatorList = {
  fnArray: number[];
  argsArray: any[][];
};

type PdfJsObjectStore = {
  get(objId: string, callback?: (value: any) => void): any;
};

type PdfJsPage = {
  getViewport(params: { scale: number }): { width: number; height: number };
  getOperatorList(): Promise<PdfJsOperatorList>;
  objs: PdfJsObjectStore;
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

type PdfJsOpCodes = {
  paintImageXObject?: number;
  paintJpegXObject?: number;
  paintImageMaskXObject?: number;
};

type PdfJsModule = {
  GlobalWorkerOptions?: { workerSrc?: string };
  getDocument(params: { data: Uint8Array }): { promise: Promise<PdfJsDocument> };
  OPS?: PdfJsOpCodes;
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

const MARGIN_TRIM_SAFETY_PX = 2; // keep a small buffer so we don't clip anti-aliased art edges
const MARGIN_COLOR_TOLERANCE = 6; // per-channel tolerance when comparing a row against the detected background color
const MARGIN_ROW_SAMPLE_STRIDE = 4; // sample every Nth pixel across a row when checking uniformity, for speed

function isUniformRow(data: Uint8ClampedArray, width: number, y: number, bg: readonly [number, number, number]) {
  for (let x = 0; x < width; x += MARGIN_ROW_SAMPLE_STRIDE) {
    const offset = (y * width + x) * 4;
    if (
      Math.abs(data[offset] - bg[0]) > MARGIN_COLOR_TOLERANCE ||
      Math.abs(data[offset + 1] - bg[1]) > MARGIN_COLOR_TOLERANCE ||
      Math.abs(data[offset + 2] - bg[2]) > MARGIN_COLOR_TOLERANCE
    ) {
      return false;
    }
  }
  return true;
}

// v30: PDFs exported from a "print-ready" or paginated source often bake a thin flat
// margin/bar onto the top and/or bottom of every page (often black, not necessarily
// matching the page's own art background). Rendered as one image per page and then
// stacked vertically in the webtoon reader, that band reads as a visible seam/border
// between otherwise-continuous artwork. Trim uniform-color top/bottom bands before
// encoding, so consecutive pages butt up against each other cleanly. The top band and
// bottom band are detected INDEPENDENTLY, each against its OWN edge row's color — not
// a single shared reference — because the top of a page is often actual art (e.g. a
// colored background) while only the bottom carries the stray bar, or vice versa; a
// single reference color would miss whichever edge doesn't happen to match it.
// Deliberately only trims top/bottom (not left/right) — that's the axis that actually
// causes a visible line in a VERTICAL stack; side margins don't produce the reported
// seam and are left alone to minimize the chance of clipping intentional framing/art.
function trimVerticalMargins(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): HTMLCanvasElement {
  const { width, height } = canvas;
  if (width < 20 || height < 40) return canvas;

  let data: Uint8ClampedArray;
  try {
    data = context.getImageData(0, 0, width, height).data;
  } catch {
    return canvas; // be conservative if pixel readback ever fails for any reason
  }

  const topBg: readonly [number, number, number] = [data[0], data[1], data[2]];
  const lastRowOffset = (height - 1) * width * 4;
  const bottomBg: readonly [number, number, number] = [
    data[lastRowOffset],
    data[lastRowOffset + 1],
    data[lastRowOffset + 2],
  ];

  let top = 0;
  while (top < height / 2 && isUniformRow(data, width, top, topBg)) top += 1;
  let bottom = height - 1;
  while (bottom > height / 2 && isUniformRow(data, width, bottom, bottomBg)) bottom -= 1;

  top = Math.max(0, top - MARGIN_TRIM_SAFETY_PX);
  bottom = Math.min(height - 1, bottom + MARGIN_TRIM_SAFETY_PX);

  const trimmedHeight = bottom - top + 1;
  // Nothing meaningful to trim, or the page is (almost) entirely blank — bail out and
  // keep the original render rather than risk producing a sliver/empty image.
  if (trimmedHeight >= height - 1 || trimmedHeight < 40) return canvas;

  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = width;
  trimmedCanvas.height = trimmedHeight;
  const trimmedContext = trimmedCanvas.getContext("2d", { alpha: false });
  if (!trimmedContext) return canvas;
  trimmedContext.drawImage(canvas, 0, top, width, trimmedHeight, 0, 0, width, trimmedHeight);
  return trimmedCanvas;
}

// v30 (round 2): pdf.js resolves an embedded image XObject asynchronously the first time
// the operator list references it; `objs.get(id)` without a callback THROWS if it isn't
// resolved yet instead of returning null, so this always goes through the callback form
// and waits for it. `getOperatorList()` itself only resolves once every dependency it
// references (fonts, images) has finished loading, so by the time the caller below is
// iterating that list's ops, every image id in it is expected to resolve promptly — the
// timeout is just a last-resort escape hatch, not the expected path.
function getPdfObjectAsync(objs: PdfJsObjectStore, objId: string, timeoutMs = 4000): Promise<any> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: any) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    try {
      objs.get(objId, finish);
    } catch {
      finish(null);
      return;
    }
    setTimeout(() => finish(null), timeoutMs);
  });
}

// v30 (round 2): finds the native pixel dimensions of the largest raster image actually
// embedded in this PDF page (e.g. a full-page manga/comic scan), by walking the page's
// operator list for image-paint operations and reading that image object's own intrinsic
// width/height. Returns null for pages with no embedded raster at all (pure vector/text),
// since there's no "native resolution" to match in that case.
async function detectNativePageImageSize(
  pdfjs: PdfJsModule,
  page: PdfJsPage
): Promise<{ width: number; height: number } | null> {
  const OPS = pdfjs.OPS;
  if (!OPS || typeof page.getOperatorList !== "function" || !page.objs) return null;

  try {
    const opList = await page.getOperatorList();
    const imageOpCodes = new Set(
      [OPS.paintImageXObject, OPS.paintJpegXObject, OPS.paintImageMaskXObject].filter(
        (code): code is number => typeof code === "number"
      )
    );
    if (!imageOpCodes.size) return null;

    let best: { width: number; height: number } | null = null;
    for (let i = 0; i < opList.fnArray.length; i += 1) {
      if (!imageOpCodes.has(opList.fnArray[i])) continue;
      const objId = opList.argsArray[i]?.[0];
      if (typeof objId !== "string") continue;
      // eslint-disable-next-line no-await-in-loop
      const img = await getPdfObjectAsync(page.objs, objId);
      const width = img?.width;
      const height = img?.height;
      if (typeof width === "number" && typeof height === "number" && width > 0 && height > 0) {
        if (!best || width * height > best.width * best.height) {
          best = { width, height };
        }
      }
    }
    return best;
  } catch {
    return null;
  }
}

// Only reached when a page has no embedded raster to match (pure vector/text content).
function fallbackRenderScale(maxEdge: number) {
  const TARGET_LONG_EDGE = 4200;
  return Math.max(1.5, Math.min(3.5, TARGET_LONG_EDGE / Math.max(1, maxEdge)));
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
        // v30 (round 2): no more fixed pixel target — render each page at the SAME pixel
        // density as whatever raster image is actually embedded in the source PDF, so
        // nothing is upscaled (soft/blurry, the previous fixed-target approach's failure
        // mode whenever a scan's native resolution was lower than the target) or
        // downscaled (lossy) relative to the source. detectNativePageImageSize reads the
        // embedded image's own intrinsic width/height straight off the page's operator
        // list. A page with no embedded raster at all (pure vector/text) has no "native
        // resolution" to match — fallbackRenderScale covers only that case.
        const nativeImage = await detectNativePageImageSize(pdfjs, page);
        let scale: number;
        if (nativeImage) {
          const scaleFromWidth = nativeImage.width / Math.max(1, baseViewport.width);
          const scaleFromHeight = nativeImage.height / Math.max(1, baseViewport.height);
          scale = Math.max(scaleFromWidth, scaleFromHeight);
          if (!Number.isFinite(scale) || scale <= 0) scale = fallbackRenderScale(maxEdge);
        } else {
          scale = fallbackRenderScale(maxEdge);
        }

        // Pure browser-canvas-allocation safety ceiling, not a quality cap — real page
        // scans don't come anywhere near this; it only protects against a pathological
        // PDF (e.g. a corrupt/huge embedded image) crashing the tab.
        const MAX_CANVAS_LONG_EDGE = 10000;
        if (maxEdge * scale > MAX_CANVAS_LONG_EDGE) {
          scale = MAX_CANVAS_LONG_EDGE / Math.max(1, maxEdge);
        }

        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("Canvas 2D context is unavailable");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: context, viewport, background: "#ffffff" }).promise;
        const trimmedCanvas = trimVerticalMargins(canvas, context);
        // v30: PNG (fully lossless) was tried here first, but real comic pages at this
        // resolution came out 10-20MB EACH as PNG — big enough to fail ("Failed to
        // fetch") on ordinary/mobile connections during upload, even though the user is
        // fine with a heavy page for a long manhwa-style chapter. WebP quality 1.0 (max,
        // up from the old 0.92) is the closest this API gets to "not compressed" while
        // staying reliably uploadable.
        const blob = await canvasToBlob(trimmedCanvas, "image/webp", 1);
        files.push(
          markFileAsPreOptimized(
            blobToFile(
              blob,
              `${baseName}-page-${String(pageNumber).padStart(3, "0")}.webp`,
              "image/webp"
            )
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
