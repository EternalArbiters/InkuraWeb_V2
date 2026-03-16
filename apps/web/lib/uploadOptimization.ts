import { getUploadProfile, isImageContentType, isOptimizableUploadScope, type UploadOptimizationScope } from "@/lib/uploadProfiles";

export type PreparedUploadFile = {
  originalFile: File;
  file: File;
  originalBytes: number;
  optimizedBytes: number;
  width: number | null;
  height: number | null;
  contentType: string;
  originalContentType: string;
  compressionApplied: boolean;
  reason:
    | "optimized"
    | "not-image"
    | "scope-disabled"
    | "browser-unsupported"
    | "skip-small-modern"
    | "encode-not-smaller"
    | "optimization-failed";
  previewUrl?: string;
};

export type UploadOptimizationDecision = {
  skip: boolean;
  reason: PreparedUploadFile["reason"];
};

export function inferImageContentType(file: Pick<File, "type" | "name">): string {
  const type = String(file.type || "").trim().toLowerCase();
  if (type) return type;
  const name = String(file.name || "").toLowerCase();
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

export function getTargetImageDimensions(params: {
  scope: UploadOptimizationScope;
  width: number;
  height: number;
}) {
  const { scope, width, height } = params;
  const profile = getUploadProfile(scope);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { width: 0, height: 0, resized: false, scale: 1 };
  }

  if (scope === "pages" && width < 400) {
    return { width, height, resized: false, scale: 1 };
  }

  let scale = 1;

  if (profile.maxLongEdge) {
    const longest = Math.max(width, height);
    if (longest > profile.maxLongEdge) scale = Math.min(scale, profile.maxLongEdge / longest);
  }

  if (profile.maxWidth && width * scale > profile.maxWidth) {
    scale = Math.min(scale, profile.maxWidth / width);
  }

  if (profile.maxHeight && height * scale > profile.maxHeight) {
    scale = Math.min(scale, profile.maxHeight / height);
  }

  if (profile.maxMegapixels) {
    const maxPixels = profile.maxMegapixels * 1_000_000;
    const currentPixels = width * height;
    if (currentPixels * scale * scale > maxPixels) {
      scale = Math.min(scale, Math.sqrt(maxPixels / currentPixels));
    }
  }

  const pageMinWidthFloor = scope === "pages" ? 400 : null;
  if (pageMinWidthFloor != null && width >= pageMinWidthFloor && width * scale < pageMinWidthFloor) {
    scale = Math.max(scale, pageMinWidthFloor / width);
  }

  const nextWidth = Math.max(1, Math.round(width * scale));
  const nextHeight = Math.max(1, Math.round(height * scale));
  return {
    width: nextWidth,
    height: nextHeight,
    resized: nextWidth !== width || nextHeight !== height,
    scale,
  };
}

export function chooseOptimizedContentType(params: {
  scope: UploadOptimizationScope;
  sourceContentType: string;
  hasAlpha: boolean;
}) {
  const { scope, sourceContentType, hasAlpha } = params;
  const profile = getUploadProfile(scope);
  const source = String(sourceContentType || "").toLowerCase();

  if (!isImageContentType(source)) return source || "application/octet-stream";
  if (source === "image/gif") return "image/gif";
  if (scope === "pages") return source;
  if (hasAlpha && profile.preserveAlpha) return "image/webp";
  return profile.preferredContentType || source;
}

export function shouldSkipOptimization(params: {
  scope: UploadOptimizationScope;
  contentType: string;
  sizeBytes: number;
  width: number;
  height: number;
}) {
  const { scope, contentType, sizeBytes, width, height } = params;
  const profile = getUploadProfile(scope);
  if (!isOptimizableUploadScope(scope)) {
    return { skip: true, reason: "scope-disabled" } satisfies UploadOptimizationDecision;
  }

  const normalizedType = String(contentType || "").toLowerCase();
  if (!isImageContentType(normalizedType) || normalizedType === "image/gif") {
    return { skip: true, reason: "not-image" } satisfies UploadOptimizationDecision;
  }

  const { resized } = getTargetImageDimensions({ scope, width, height });
  const modernTarget =
    scope === "pages"
      ? normalizedType === "image/webp" || normalizedType === "image/png" || normalizedType === "image/jpeg"
      : normalizedType === profile.preferredContentType || (profile.preserveAlpha && normalizedType === "image/webp");
  const smallEnough = profile.skipReencodeBelowBytes != null && sizeBytes > 0 && sizeBytes <= profile.skipReencodeBelowBytes;

  if (!resized && modernTarget && smallEnough) {
    return { skip: true, reason: "skip-small-modern" } satisfies UploadOptimizationDecision;
  }

  return { skip: false, reason: "optimized" } satisfies UploadOptimizationDecision;
}

export async function prepareUploadFile(params: {
  scope: UploadOptimizationScope;
  file: File;
  makePreviewUrl?: boolean;
}): Promise<PreparedUploadFile> {
  const { scope, file, makePreviewUrl = false } = params;
  const originalContentType = inferImageContentType(file);

  if (!isOptimizableUploadScope(scope)) {
    return makePreparedUploadFile({
      originalFile: file,
      file,
      contentType: originalContentType,
      width: null,
      height: null,
      compressionApplied: false,
      reason: "scope-disabled",
      makePreviewUrl,
    });
  }

  if (!hasBrowserImageApis()) {
    return makePreparedUploadFile({
      originalFile: file,
      file,
      contentType: originalContentType,
      width: null,
      height: null,
      compressionApplied: false,
      reason: "browser-unsupported",
      makePreviewUrl,
    });
  }

  try {
    const decoded = await decodeImageFile(file);
    const decision = shouldSkipOptimization({
      scope,
      contentType: originalContentType,
      sizeBytes: file.size,
      width: decoded.width,
      height: decoded.height,
    });

    if (decision.skip) {
      decoded.release();
      return makePreparedUploadFile({
        originalFile: file,
        file,
        contentType: originalContentType,
        width: decoded.width,
        height: decoded.height,
        compressionApplied: false,
        reason: decision.reason,
        makePreviewUrl,
      });
    }

    const target = getTargetImageDimensions({ scope, width: decoded.width, height: decoded.height });
    const canvas = createCanvas(target.width, target.height);
    const context = getCanvasContext(canvas);
    context.drawImage(decoded.source, 0, 0, target.width, target.height);

    const hasAlpha = await canvasHasAlpha(canvas, context, target.width, target.height);
    const contentType = chooseOptimizedContentType({
      scope,
      sourceContentType: originalContentType,
      hasAlpha,
    });
    const quality = getUploadProfile(scope).quality ?? undefined;
    const blob = await canvasToBlob(canvas, contentType, quality);
    decoded.release();

    if (!blob || blob.size <= 0) {
      return makePreparedUploadFile({
        originalFile: file,
        file,
        contentType: originalContentType,
        width: target.width,
        height: target.height,
        compressionApplied: false,
        reason: "optimization-failed",
        makePreviewUrl,
      });
    }

    if (blob.size > file.size) {
      return makePreparedUploadFile({
        originalFile: file,
        file,
        contentType: originalContentType,
        width: decoded.width,
        height: decoded.height,
        compressionApplied: false,
        reason: "encode-not-smaller",
        makePreviewUrl,
      });
    }

    const sameDimensions = target.width === decoded.width && target.height === decoded.height;
    const sameContentType = contentType === originalContentType;
    const minimalSavingsRatio =
      scope === "pages" && sameDimensions && sameContentType && (originalContentType === "image/jpeg" || originalContentType === "image/webp")
        ? 0.1
        : 0.02;

    if (blob.size >= file.size * (1 - minimalSavingsRatio) && sameDimensions && sameContentType) {
      return makePreparedUploadFile({
        originalFile: file,
        file,
        contentType: originalContentType,
        width: decoded.width,
        height: decoded.height,
        compressionApplied: false,
        reason: "encode-not-smaller",
        makePreviewUrl,
      });
    }

    const optimizedFile = new File([blob], replaceFileExtension(file.name, contentType), {
      type: contentType,
      lastModified: file.lastModified,
    });

    return makePreparedUploadFile({
      originalFile: file,
      file: optimizedFile,
      contentType,
      width: target.width,
      height: target.height,
      compressionApplied: optimizedFile.size !== file.size || optimizedFile.type !== file.type,
      reason: optimizedFile.size < file.size || target.resized || optimizedFile.type !== file.type ? "optimized" : "encode-not-smaller",
      makePreviewUrl,
    });
  } catch {
    return makePreparedUploadFile({
      originalFile: file,
      file,
      contentType: originalContentType,
      width: null,
      height: null,
      compressionApplied: false,
      reason: "optimization-failed",
      makePreviewUrl,
    });
  }
}


export type PreparedUploadSummary = {
  count: number;
  originalBytes: number;
  optimizedBytes: number;
  bytesSaved: number;
  compressedCount: number;
};

export function summarizePreparedUploadFiles(files: PreparedUploadFile[]): PreparedUploadSummary {
  return files.reduce<PreparedUploadSummary>(
    (acc, entry) => {
      acc.count += 1;
      acc.originalBytes += entry.originalBytes;
      acc.optimizedBytes += entry.optimizedBytes;
      acc.bytesSaved += Math.max(0, entry.originalBytes - entry.optimizedBytes);
      if (entry.compressionApplied) acc.compressedCount += 1;
      return acc;
    },
    { count: 0, originalBytes: 0, optimizedBytes: 0, bytesSaved: 0, compressedCount: 0 }
  );
}

export async function prepareUploadFiles(params: {
  scope: UploadOptimizationScope;
  files: File[];
  makePreviewUrl?: boolean;
}) {
  const { scope, files, makePreviewUrl } = params;
  return Promise.all(files.map((file) => prepareUploadFile({ scope, file, makePreviewUrl })));
}

function makePreparedUploadFile(params: {
  originalFile: File;
  file: File;
  contentType: string;
  width: number | null;
  height: number | null;
  compressionApplied: boolean;
  reason: PreparedUploadFile["reason"];
  makePreviewUrl: boolean;
}): PreparedUploadFile {
  return {
    originalFile: params.originalFile,
    file: params.file,
    originalBytes: params.originalFile.size,
    optimizedBytes: params.file.size,
    width: params.width,
    height: params.height,
    contentType: params.contentType,
    originalContentType: inferImageContentType(params.originalFile),
    compressionApplied: params.compressionApplied,
    reason: params.reason,
    previewUrl: params.makePreviewUrl && typeof URL !== "undefined" ? URL.createObjectURL(params.file) : undefined,
  };
}

function hasBrowserImageApis() {
  return typeof window !== "undefined" && typeof Blob !== "undefined" && typeof URL !== "undefined";
}

type DecodedImage = {
  width: number;
  height: number;
  source: CanvasImageSource;
  release: () => void;
};

async function decodeImageFile(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      source: bitmap,
      release: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadHtmlImage(objectUrl);
    return {
      width: img.naturalWidth,
      height: img.naturalHeight,
      source: img,
      release: () => URL.revokeObjectURL(objectUrl),
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

function loadHtmlImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image"));
    img.src = src;
  });
}

type CanvasLike = OffscreenCanvas | HTMLCanvasElement;
type CanvasRenderingContextLike = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

function createCanvas(width: number, height: number): CanvasLike {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getCanvasContext(canvas: CanvasLike): CanvasRenderingContextLike {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) throw new Error("Unable to acquire 2D canvas context");
  return context;
}

async function canvasHasAlpha(
  canvas: CanvasLike,
  context: CanvasRenderingContextLike,
  width: number,
  height: number
) {
  if (width <= 0 || height <= 0) return false;
  try {
    const sampleWidth = Math.max(1, Math.min(width, 64));
    const sampleHeight = Math.max(1, Math.min(height, 64));

    if (sampleWidth !== width || sampleHeight !== height) {
      const probe = createCanvas(sampleWidth, sampleHeight);
      const probeContext = getCanvasContext(probe);
      probeContext.drawImage(canvas as CanvasImageSource, 0, 0, sampleWidth, sampleHeight);
      const imageData = probeContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
      for (let index = 3; index < imageData.length; index += 4) {
        if (imageData[index] < 255) return true;
      }
      return false;
    }

    const imageData = context.getImageData(0, 0, width, height).data;
    for (let index = 3; index < imageData.length; index += 4) {
      if (imageData[index] < 255) return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function canvasToBlob(canvas: CanvasLike, contentType: string, quality?: number) {
  if (typeof OffscreenCanvas !== "undefined" && canvas instanceof OffscreenCanvas && typeof canvas.convertToBlob === "function") {
    return canvas.convertToBlob({ type: contentType, quality });
  }
  const htmlCanvas = canvas as HTMLCanvasElement;
  return new Promise<Blob | null>((resolve) => {
    htmlCanvas.toBlob((blob) => resolve(blob), contentType, quality);
  });
}

function replaceFileExtension(filename: string, contentType: string) {
  const ext = extensionForContentType(contentType);
  if (!filename) return `upload.${ext}`;
  const lastDot = filename.lastIndexOf(".");
  if (lastDot <= 0) return `${filename}.${ext}`;
  return `${filename.slice(0, lastDot)}.${ext}`;
}

function extensionForContentType(contentType: string) {
  switch (contentType) {
    case "image/webp":
      return "webp";
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}
