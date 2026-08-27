"use client";

import { markFileAsPreOptimized } from "@/lib/uploadOptimization";

const ZIP_CDN_URL = "https://unpkg.com/jszip@3.10.1/dist/jszip.min.js";
const PDFJS_CDN_URL = "https://unpkg.com/pdfjs-dist@4.9.124/build/pdf.min.mjs";
const PDFJS_WORKER_CDN_URL = "https://unpkg.com/pdfjs-dist@4.9.124/build/pdf.worker.min.mjs";
// v30 (round 7): the browser's native canvas.toBlob("image/webp") only ever uses WebP's
// LOSSY encoder, even at quality 1.0 — there's no standard way to reach libwebp's actual
// lossless mode through that API. @jsquash/webp is a WASM build of libwebp that exposes
// real lossless encoding directly. Loaded from esm.sh (not unpkg, like the others above)
// because esm.sh rewrites a package's internal relative imports/wasm asset references to
// also resolve through esm.sh — needed for a package whose build assumes a bundler, unlike
// pdf.js's CDN build above which is already a bundled, dependency-free single file.
const WEBP_LOSSLESS_ENCODER_CDN_URL = "https://esm.sh/@jsquash/webp@1.4.0";

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
  paintImageXObjectRepeat?: number;
  paintInlineImageXObject?: number;
};

type PdfJsModule = {
  GlobalWorkerOptions?: { workerSrc?: string };
  getDocument(params: { data: Uint8Array; password?: string }): { promise: Promise<PdfJsDocument> };
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

type WebpLosslessEncoder = { encode: (imageData: ImageData, options?: Record<string, unknown>) => Promise<ArrayBuffer> };

let webpLosslessEncoderPromise: Promise<WebpLosslessEncoder | null> | null = null;

// v30 (round 7): lazily loads the WASM lossless WebP encoder, caching the (successful or
// failed) attempt so only the first page of a PDF pays for it. Never throws — a load
// failure (CDN unreachable, unexpected module shape, WASM unsupported) just means the
// caller falls back to the already-confirmed-correct PNG path below.
async function loadWebpLosslessEncoder(): Promise<WebpLosslessEncoder | null> {
  if (!webpLosslessEncoderPromise) {
    webpLosslessEncoderPromise = (async () => {
      try {
        const importExternalModule = getExternalModuleImporter();
        const mod: any = await importExternalModule(WEBP_LOSSLESS_ENCODER_CDN_URL);
        const encode = mod?.encode || mod?.default?.encode;
        return typeof encode === "function" ? { encode } : null;
      } catch {
        return null;
      }
    })();
  }
  return webpLosslessEncoderPromise;
}

// v30 (round 7): attempts a genuinely lossless WebP encode of the given canvas via the
// WASM encoder above. Returns null (never throws) on ANY failure — encoder unavailable,
// unexpected output, anything — so the caller can safely fall back to PNG.
async function tryEncodeLosslessWebp(canvas: HTMLCanvasElement): Promise<Blob | null> {
  try {
    const encoder = await loadWebpLosslessEncoder();
    if (!encoder) return null;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return null;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const encoded = await encoder.encode(imageData, { lossless: 1, quality: 100 });
    if (!encoded || encoded.byteLength <= 0) return null;
    return new Blob([encoded], { type: "image/webp" });
  } catch {
    return null;
  }
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
function getPdfObjectAsync(objs: PdfJsObjectStore, objId: string, timeoutMs = 20000): Promise<any> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: any, timedOut = false) => {
      if (settled) return;
      settled = true;
      if (timedOut) {
        try {
          // eslint-disable-next-line no-console
          console.warn(`[pdf-import] object "${objId}" did not resolve within ${timeoutMs}ms`);
        } catch {}
      }
      resolve(value);
    };
    try {
      objs.get(objId, finish);
    } catch {
      finish(null);
      return;
    }
    setTimeout(() => finish(null, true), timeoutMs);
  });
}

type NativePdfImage = { width: number; height: number; raw: any };

// v30 (round 8): logs (to the browser console, visible in Studio during import) exactly
// why a given page fell back to the softer page.render() path, since per-page inconsistency
// ("some pages HD, some blurry" within one otherwise-uniform PDF) means detection/extraction
// is silently failing for SOME pages but not others — this makes the actual reason visible
// instead of swallowed by a catch-and-return-null.
function logNativeExtractionFallback(pageNumber: number, reason: string, detail?: unknown) {
  try {
    // eslint-disable-next-line no-console
    console.warn(`[pdf-import] page ${pageNumber}: falling back to page.render() — ${reason}`, detail ?? "");
  } catch {}
}

// v30 (round 2): finds the largest raster image actually embedded in this PDF page (e.g.
// a full-page manga/comic scan), by walking the page's operator list for image-paint
// operations and reading that image object's own intrinsic width/height — plus (round 5)
// the resolved image object itself, so the caller can attempt to draw its pixels directly.
// Returns null for pages with no embedded raster at all (pure vector/text), since there's
// no "native resolution" to match in that case.
async function detectNativePageImage(pdfjs: PdfJsModule, page: PdfJsPage, pageNumber: number): Promise<NativePdfImage | null> {
  const OPS = pdfjs.OPS;
  if (!OPS) {
    logNativeExtractionFallback(pageNumber, "pdf.js build exposes no OPS table");
    return null;
  }
  if (typeof page.getOperatorList !== "function" || !page.objs) {
    logNativeExtractionFallback(pageNumber, "pdf.js build exposes no getOperatorList/objs");
    return null;
  }

  try {
    const opList = await page.getOperatorList();
    // v30 (round 8): also recognize the "repeat" and inline-image paint ops — a page whose
    // content stream references its image via one of these (instead of plain
    // paintImageXObject/paintJpegXObject) was previously invisible to this scan entirely,
    // silently falling back for that page alone while sibling pages using the plain op
    // succeeded — a very plausible explanation for the reported per-page inconsistency.
    const imageOpCodes = new Set(
      [
        OPS.paintImageXObject,
        OPS.paintJpegXObject,
        OPS.paintImageMaskXObject,
        OPS.paintImageXObjectRepeat,
        OPS.paintInlineImageXObject,
      ].filter((code): code is number => typeof code === "number")
    );
    if (!imageOpCodes.size) {
      logNativeExtractionFallback(pageNumber, "no recognized image-paint op codes in this pdf.js build");
      return null;
    }

    let best: NativePdfImage | null = null;
    let candidateCount = 0;
    for (let i = 0; i < opList.fnArray.length; i += 1) {
      if (!imageOpCodes.has(opList.fnArray[i])) continue;
      const objId = opList.argsArray[i]?.[0];
      if (typeof objId !== "string") continue;
      candidateCount += 1;
      // eslint-disable-next-line no-await-in-loop
      const img = await getPdfObjectAsync(page.objs, objId);
      const width = img?.width;
      const height = img?.height;
      if (typeof width === "number" && typeof height === "number" && width > 0 && height > 0) {
        if (!best || width * height > best.width * best.height) {
          best = { width, height, raw: img };
        }
      } else {
        logNativeExtractionFallback(pageNumber, `image object "${objId}" resolved without usable width/height`, img);
      }
    }
    if (!best) {
      logNativeExtractionFallback(
        pageNumber,
        candidateCount > 0
          ? `found ${candidateCount} image op(s) but none resolved to a usable image (pure vector/text page, or every candidate failed above)`
          : "no image-paint ops found on this page (pure vector/text page)"
      );
    }
    return best;
  } catch (error) {
    logNativeExtractionFallback(pageNumber, "getOperatorList() threw", error);
    return null;
  }
}

const PDF_IMAGE_KIND_GRAYSCALE_1BPP = 1;
const PDF_IMAGE_KIND_RGB_24BPP = 2;
const PDF_IMAGE_KIND_RGBA_32BPP = 3;

// v30 (round 5): draws the PDF's embedded raster image object DIRECTLY onto the
// destination canvas at its own native pixel dimensions, bypassing pdf.js's normal
// page-render/composite pipeline entirely. page.render() draws everything (including this
// image) through the page's coordinate transform matrix — even when the requested render
// scale is chosen to nominally match the image 1:1, canvas 2D compositing through an
// arbitrary transform can still introduce sub-pixel resampling, since nothing guarantees
// the transform lands the image on exact integer pixel boundaries. That's the likely
// explanation for a still-visible softness even once encoding is fully lossless (PNG):
// the loss was never in the encode step, it was already baked into the canvas before
// encoding even started. This writes the decoded pixel buffer straight into the canvas
// with no transform involved at all — the only way to guarantee a truly untouched,
// pixel-for-pixel copy. Returns false (leaving the canvas untouched) for any image shape
// it doesn't confidently recognize, so the caller can fall back to the normal
// page.render() path exactly as before.
function tryDrawNativePdfImage(raw: any, context: CanvasRenderingContext2D, width: number, height: number): boolean {
  if (!raw) return false;
  try {
    if (typeof raw.close === "function" && typeof raw.width === "number" && typeof raw.height === "number") {
      context.drawImage(raw as CanvasImageSource, 0, 0, width, height);
      return true;
    }

    const data = raw.data as Uint8ClampedArray | undefined;
    if (!data || typeof raw.kind !== "number") return false;

    const rgba = new Uint8ClampedArray(width * height * 4);
    if (raw.kind === PDF_IMAGE_KIND_RGBA_32BPP) {
      if (data.length < width * height * 4) return false;
      rgba.set(data.subarray(0, width * height * 4));
    } else if (raw.kind === PDF_IMAGE_KIND_RGB_24BPP) {
      if (data.length < width * height * 3) return false;
      for (let pixel = 0, byteOffset = 0; pixel < width * height; pixel += 1, byteOffset += 3) {
        const outOffset = pixel * 4;
        rgba[outOffset] = data[byteOffset];
        rgba[outOffset + 1] = data[byteOffset + 1];
        rgba[outOffset + 2] = data[byteOffset + 2];
        rgba[outOffset + 3] = 255;
      }
    } else if (raw.kind === PDF_IMAGE_KIND_GRAYSCALE_1BPP) {
      const bytesPerRow = Math.ceil(width / 8);
      if (data.length < bytesPerRow * height) return false;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const byteIndex = y * bytesPerRow + (x >> 3);
          const bit = 7 - (x & 7);
          const value = (data[byteIndex] >> bit) & 1 ? 255 : 0;
          const outOffset = (y * width + x) * 4;
          rgba[outOffset] = value;
          rgba[outOffset + 1] = value;
          rgba[outOffset + 2] = value;
          rgba[outOffset + 3] = 255;
        }
      }
    } else {
      return false;
    }

    context.putImageData(new ImageData(rgba, width, height), 0, 0);
    return true;
  } catch {
    return false;
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

export async function importComicPagesFromPdf(pdfFile: File, password?: string | null): Promise<File[]> {
  const pdfjs = await loadPdfJs();
  const trimmedPassword = String(password || "").trim();
  const task = pdfjs.getDocument({
    data: new Uint8Array(await pdfFile.arrayBuffer()),
    ...(trimmedPassword ? { password: trimmedPassword } : {}),
  });
  let pdf: PdfJsDocument;
  try {
    pdf = await task.promise;
  } catch (error: any) {
    // v30: pdf.js rejects with a PasswordException (code 1 = needs a password, code 2 =
    // the one supplied was wrong) for encrypted PDFs — surface that distinctly instead of
    // the generic "did not produce any image pages" failure, since the fix here is
    // entirely different (set/correct the work's PDF password, not a file problem).
    if (error?.name === "PasswordException") {
      throw new Error(
        error?.code === 1
          ? "This PDF is password-protected. Set this work's PDF password in Edit Work, then try again."
          : "The PDF password saved for this work is incorrect for this file."
      );
    }
    throw error;
  }
  const baseName = sanitizeBaseName(pdfFile.name) || "chapter";
  const files: File[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      try {
        const baseViewport = page.getViewport({ scale: 1 });
        const maxEdge = Math.max(baseViewport.width, baseViewport.height);
        // Pure browser-canvas-allocation safety ceiling, not a quality cap. v30 (round 8):
        // this was set to 10000 assuming "no real page scan needs more than that" — wrong.
        // Long manhwa-style strips (one narrow, very tall image per PDF "page") routinely
        // exceed it: real console data from this exact bug showed native heights of
        // 11499-15096px at only 720px wide, ALL getting silently rejected from the direct
        // pixel-extraction path and forced through a downscaled page.render() fallback
        // instead — with each page's downscale ratio differing (more height over the cap =
        // more forced reduction), which is exactly what produced "some pages HD, some
        // blurry" within a single otherwise-uniform PDF. Raised well above that observed
        // range, comfortably under common per-dimension canvas limits (~32767px in most
        // browsers).
        const MAX_CANVAS_LONG_EDGE = 24000;

        // v30 (round 2): render each page at the SAME pixel density as whatever raster
        // image is actually embedded in the source PDF, so nothing is upscaled (soft) or
        // downscaled (lossy) relative to the source. detectNativePageImage reads the
        // embedded image's own intrinsic width/height (and the resolved image object
        // itself) straight off the page's operator list.
        const nativeImage = await detectNativePageImage(pdfjs, page, pageNumber);

        let canvas: HTMLCanvasElement | null = null;
        let context: CanvasRenderingContext2D | null = null;

        if (nativeImage) {
          if (Math.max(nativeImage.width, nativeImage.height) > MAX_CANVAS_LONG_EDGE) {
            logNativeExtractionFallback(
              pageNumber,
              `detected image ${nativeImage.width}x${nativeImage.height} exceeds the ${MAX_CANVAS_LONG_EDGE}px safety cap`
            );
          } else {
            const candidate = document.createElement("canvas");
            candidate.width = Math.max(1, Math.round(nativeImage.width));
            candidate.height = Math.max(1, Math.round(nativeImage.height));
            const candidateContext = candidate.getContext("2d", { alpha: false });
            if (!candidateContext) {
              logNativeExtractionFallback(pageNumber, "could not acquire a 2D context for the direct-draw candidate canvas");
            } else {
              candidateContext.fillStyle = "#ffffff";
              candidateContext.fillRect(0, 0, candidate.width, candidate.height);
              // v30 (round 5): try drawing the embedded image's own pixels directly first —
              // see tryDrawNativePdfImage for why this is more trustworthy than rendering
              // the page through pdf.js's normal transform pipeline even at a matched scale.
              if (tryDrawNativePdfImage(nativeImage.raw, candidateContext, candidate.width, candidate.height)) {
                canvas = candidate;
                context = candidateContext;
              } else {
                logNativeExtractionFallback(
                  pageNumber,
                  "tryDrawNativePdfImage did not recognize this image object's shape",
                  nativeImage.raw
                );
              }
            }
          }
        }

        if (!canvas || !context) {
          // Fallback: the normal page.render() path — used whenever there's no embedded
          // raster to match (pure vector/text pages) or the direct pixel draw above
          // wasn't confidently applicable for this particular image's shape.
          let scale: number;
          if (nativeImage) {
            const scaleFromWidth = nativeImage.width / Math.max(1, baseViewport.width);
            const scaleFromHeight = nativeImage.height / Math.max(1, baseViewport.height);
            scale = Math.max(scaleFromWidth, scaleFromHeight);
            if (!Number.isFinite(scale) || scale <= 0) scale = fallbackRenderScale(maxEdge);
          } else {
            scale = fallbackRenderScale(maxEdge);
          }
          if (maxEdge * scale > MAX_CANVAS_LONG_EDGE) {
            scale = MAX_CANVAS_LONG_EDGE / Math.max(1, maxEdge);
          }

          const viewport = page.getViewport({ scale });
          canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.ceil(viewport.width));
          canvas.height = Math.max(1, Math.ceil(viewport.height));
          const fallbackContext = canvas.getContext("2d", { alpha: false });
          if (!fallbackContext) throw new Error("Canvas 2D context is unavailable");
          context = fallbackContext;
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: context, viewport, background: "#ffffff" }).promise;
        }

        if (!canvas || !context) throw new Error("Canvas 2D context is unavailable");
        const trimmedCanvas = trimVerticalMargins(canvas, context);
        // v30 (round 7): the browser's own WebP encoder (round 6) turned out to still be
        // visibly softer than PNG even on these now-clean, unresampled pixels — confirming
        // it really is WebP's LOSSY encoder itself that's the limiting factor here (its
        // quality-1.0 setting is still lossy, not literal losslessness), not the render
        // path. Try a genuinely lossless WebP encode via the WASM encoder above first —
        // real lossless compression, typically noticeably smaller than PNG at identical
        // fidelity — and fall back to the confirmed-correct PNG path if that encoder isn't
        // available or fails for any reason.
        let blob = await tryEncodeLosslessWebp(trimmedCanvas);
        let outputExtension = "webp";
        let outputContentType = "image/webp";
        if (!blob) {
          blob = await canvasToBlob(trimmedCanvas, "image/png");
          outputExtension = "png";
          outputContentType = "image/png";
        }
        files.push(
          markFileAsPreOptimized(
            blobToFile(
              blob,
              `${baseName}-page-${String(pageNumber).padStart(3, "0")}.${outputExtension}`,
              outputContentType
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
