export type UploadOptimizationScope =
  | "avatar"
  | "covers"
  | "pages"
  | "files"
  | "admin_report_attachments"
  | "comment_images"
  | "comment_gifs";

export type UploadImageContentType = "image/webp" | "image/png" | "image/jpeg" | "image/gif";

export type UploadOptimizationProfile = {
  scope: UploadOptimizationScope;
  maxBytes: number;
  allowedContentTypes: readonly string[];
  allowOptimization: boolean;
  preferredContentType: string | null;
  preserveAlpha: boolean;
  stripMetadata: boolean;
  preserveAnimation: boolean;
  quality: number | null;
  minWidth: number | null;
  minHeight: number | null;
  maxWidth: number | null;
  maxHeight: number | null;
  maxLongEdge: number | null;
  maxMegapixels: number | null;
  targetAspectRatio: number | null;
  skipReencodeBelowBytes: number | null;
  notes: readonly string[];
};

const MB = 1024 * 1024;
const KB = 1024;

export const UPLOAD_PROFILES: Record<UploadOptimizationScope, UploadOptimizationProfile> = {
  avatar: {
    scope: "avatar",
    maxBytes: 2 * MB,
    allowedContentTypes: ["image/webp", "image/png", "image/jpeg"],
    allowOptimization: true,
    preferredContentType: "image/webp",
    preserveAlpha: true,
    stripMetadata: true,
    preserveAnimation: false,
    quality: 0.82,
    minWidth: 64,
    minHeight: 64,
    maxWidth: 640,
    maxHeight: 640,
    maxLongEdge: 640,
    maxMegapixels: 1,
    targetAspectRatio: 1,
    skipReencodeBelowBytes: 256 * KB,
    notes: [
      "Keep client-side focus and zoom behavior intact; do not hard-crop during optimization.",
      "Drop EXIF metadata and normalize orientation before upload.",
    ],
  },
  covers: {
    scope: "covers",
    maxBytes: 2 * MB,
    allowedContentTypes: ["image/webp", "image/png", "image/jpeg"],
    allowOptimization: true,
    preferredContentType: "image/webp",
    preserveAlpha: true,
    stripMetadata: true,
    preserveAnimation: false,
    quality: 0.82,
    minWidth: 300,
    minHeight: 400,
    maxWidth: 900,
    maxHeight: 1200,
    maxLongEdge: 1200,
    maxMegapixels: 2,
    targetAspectRatio: 3 / 4,
    skipReencodeBelowBytes: 384 * KB,
    notes: [
      "Match the existing canonical 3:4 cover output unless a later migration updates the contract.",
      "Avoid upscaling smaller artwork; preserve framing until a dedicated crop UI is in place.",
    ],
  },
  pages: {
    scope: "pages",
    maxBytes: 12 * MB,
    allowedContentTypes: ["image/webp", "image/png", "image/jpeg"],
    allowOptimization: true,
    preferredContentType: null,
    preserveAlpha: true,
    stripMetadata: true,
    preserveAnimation: false,
    quality: 0.98,
    minWidth: null,
    minHeight: 400,
    maxWidth: 3600,
    maxHeight: 7200,
    maxLongEdge: 5600,
    maxMegapixels: 20,
    targetAspectRatio: null,
    skipReencodeBelowBytes: 5120 * KB,
    notes: [
      "Keep fit-to-screen fidelity close to the source so comic pages still look raw-sharp during normal reading.",
      "Only soften extreme zoom by downscaling genuinely oversized uploads instead of compressing ordinary pages aggressively.",
    ],
  },
  admin_report_attachments: {
    scope: "admin_report_attachments",
    maxBytes: 10 * MB,
    allowedContentTypes: ["image/webp", "image/png", "image/jpeg", "application/pdf", "application/octet-stream"],
    allowOptimization: false,
    preferredContentType: null,
    preserveAlpha: true,
    stripMetadata: false,
    preserveAnimation: false,
    quality: null,
    minWidth: null,
    minHeight: null,
    maxWidth: null,
    maxHeight: null,
    maxLongEdge: null,
    maxMegapixels: null,
    targetAspectRatio: null,
    skipReencodeBelowBytes: null,
    notes: [
      "Keep admin inbox attachments simple: images or files without forcing a separate media pipeline.",
      "Validation stays strict while preserving exact uploaded evidence for support triage.",
    ],
  },
  files: {
    scope: "files",
    maxBytes: 20 * MB,
    allowedContentTypes: ["application/pdf", "application/octet-stream"],
    allowOptimization: false,
    preferredContentType: null,
    preserveAlpha: false,
    stripMetadata: false,
    preserveAnimation: false,
    quality: null,
    minWidth: null,
    minHeight: null,
    maxWidth: null,
    maxHeight: null,
    maxLongEdge: null,
    maxMegapixels: null,
    targetAspectRatio: null,
    skipReencodeBelowBytes: null,
    notes: ["Non-image uploads are validated but not optimized in the browser."],
  },
  comment_images: {
    scope: "comment_images",
    maxBytes: 2 * MB,
    allowedContentTypes: ["image/webp", "image/png", "image/jpeg"],
    allowOptimization: true,
    preferredContentType: "image/webp",
    preserveAlpha: true,
    stripMetadata: true,
    preserveAnimation: false,
    quality: 0.8,
    minWidth: 64,
    minHeight: 64,
    maxWidth: 1280,
    maxHeight: 1280,
    maxLongEdge: 1280,
    maxMegapixels: 2,
    targetAspectRatio: null,
    skipReencodeBelowBytes: 192 * KB,
    notes: [
      "Hashing must run on the optimized blob once the client integration lands.",
      "Keep transparent stickers and reaction art alpha-safe.",
    ],
  },
  comment_gifs: {
    scope: "comment_gifs",
    maxBytes: 5 * MB,
    allowedContentTypes: ["image/gif"],
    allowOptimization: false,
    preferredContentType: "image/gif",
    preserveAlpha: false,
    stripMetadata: false,
    preserveAnimation: true,
    quality: null,
    minWidth: null,
    minHeight: null,
    maxWidth: null,
    maxHeight: null,
    maxLongEdge: null,
    maxMegapixels: null,
    targetAspectRatio: null,
    skipReencodeBelowBytes: null,
    notes: ["Animated GIF uploads stay untouched until a dedicated animation pipeline exists."],
  },
};

export function getUploadProfile(scope: UploadOptimizationScope): UploadOptimizationProfile {
  return UPLOAD_PROFILES[scope];
}

export function isImageContentType(contentType: string | null | undefined): contentType is UploadImageContentType {
  const normalized = String(contentType || "").toLowerCase();
  return normalized === "image/webp" || normalized === "image/png" || normalized === "image/jpeg" || normalized === "image/gif";
}

export function isOptimizableUploadScope(scope: UploadOptimizationScope): boolean {
  return getUploadProfile(scope).allowOptimization;
}

export function isAllowedUploadContentTypeForScope(scope: UploadOptimizationScope, contentType: string): boolean {
  const normalized = String(contentType || "").toLowerCase();
  return getUploadProfile(scope).allowedContentTypes.includes(normalized);
}

export function maxBytesForOptimizationScope(scope: UploadOptimizationScope): number {
  return getUploadProfile(scope).maxBytes;
}
