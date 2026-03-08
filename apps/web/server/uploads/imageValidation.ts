import "server-only";

import { getUploadProfile, isOptimizableUploadScope, type UploadOptimizationScope } from "@/lib/uploadProfiles";

export type UploadOptimizationMeta = {
  optimizationVersion?: string;
  originalBytes?: number;
  optimizedBytes?: number;
  originalContentType?: string;
  optimizedContentType?: string;
  width?: number | null;
  height?: number | null;
  compressionApplied?: boolean;
  reason?: string;
};

export type UploadValidationResult = {
  meta?: UploadOptimizationMeta;
  expectsOptimizationMeta: boolean;
  usedOptimizationMeta: boolean;
  fallbackUsed: boolean;
  warnings: string[];
};

function normalizeOptionalString(value: unknown, max = 120): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  return normalized.slice(0, max);
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  const num = Number(value);
  if (!Number.isFinite(num) || num < 0) return undefined;
  return num;
}

function normalizeOptionalDimension(value: unknown): number | null | undefined {
  if (value == null || value == "") return undefined;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num);
}

function normalizeOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function hasAnyMetaValue(input: Record<string, unknown>) {
  return Object.values(input).some((value) => value != null && value !== "");
}

export function expectsOptimizationMeta(scope: UploadOptimizationScope) {
  return scope === "avatar" || scope === "covers" || scope === "pages" || scope === "comment_images";
}

export function readUploadOptimizationMeta(input: unknown): UploadOptimizationMeta | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;

  const meta: UploadOptimizationMeta = {
    optimizationVersion: normalizeOptionalString((input as Record<string, unknown>).optimizationVersion),
    originalBytes: normalizeOptionalNumber((input as Record<string, unknown>).originalBytes),
    optimizedBytes: normalizeOptionalNumber((input as Record<string, unknown>).optimizedBytes),
    originalContentType: normalizeOptionalString((input as Record<string, unknown>).originalContentType),
    optimizedContentType: normalizeOptionalString((input as Record<string, unknown>).optimizedContentType),
    width: normalizeOptionalDimension((input as Record<string, unknown>).width),
    height: normalizeOptionalDimension((input as Record<string, unknown>).height),
    compressionApplied: normalizeOptionalBoolean((input as Record<string, unknown>).compressionApplied),
    reason: normalizeOptionalString((input as Record<string, unknown>).reason),
  };

  return hasAnyMetaValue(meta as Record<string, unknown>) ? meta : undefined;
}

export function validateUploadOptimizationMeta(params: {
  scope: UploadOptimizationScope;
  contentType: string;
  sizeBytes: number;
  meta?: UploadOptimizationMeta;
}): UploadValidationResult {
  const { scope, contentType, sizeBytes, meta } = params;
  const warnings: string[] = [];
  const profile = getUploadProfile(scope);
  const expectsMeta = expectsOptimizationMeta(scope);

  if (!expectsMeta || !isOptimizableUploadScope(scope)) {
    return {
      meta,
      expectsOptimizationMeta: expectsMeta,
      usedOptimizationMeta: !!meta,
      fallbackUsed: false,
      warnings,
    };
  }

  if (!meta) {
    warnings.push("optimization_meta_missing");
    return {
      expectsOptimizationMeta: expectsMeta,
      usedOptimizationMeta: false,
      fallbackUsed: true,
      warnings,
    };
  }

  if (meta.optimizedBytes != null && sizeBytes > 0 && Math.abs(meta.optimizedBytes - sizeBytes) > 16) {
    throw new Error("optimized size does not match upload payload");
  }

  if (meta.optimizedContentType && contentType && meta.optimizedContentType !== contentType) {
    throw new Error("optimized content type does not match upload payload");
  }

  if (meta.originalBytes != null && meta.optimizedBytes != null && meta.originalBytes < meta.optimizedBytes) {
    warnings.push("optimized_larger_than_original_claim");
  }

  if (meta.width === null || meta.height === null) {
    throw new Error("invalid optimized dimensions");
  }

  if (meta.width != null && meta.height != null) {
    if (profile.minWidth != null && meta.width < profile.minWidth) {
      throw new Error(`optimized width below minimum (${profile.minWidth}px)`);
    }
    if (profile.minHeight != null && meta.height < profile.minHeight) {
      throw new Error(`optimized height below minimum (${profile.minHeight}px)`);
    }
    if (profile.maxWidth != null && meta.width > profile.maxWidth) {
      throw new Error(`optimized width above maximum (${profile.maxWidth}px)`);
    }
    if (profile.maxHeight != null && meta.height > profile.maxHeight) {
      throw new Error(`optimized height above maximum (${profile.maxHeight}px)`);
    }
    if (profile.maxLongEdge != null && Math.max(meta.width, meta.height) > profile.maxLongEdge) {
      throw new Error(`optimized dimensions exceed long-edge limit (${profile.maxLongEdge}px)`);
    }
  } else {
    warnings.push("optimized_dimensions_missing");
  }

  if (!meta.optimizationVersion) warnings.push("optimization_version_missing");
  if (!meta.optimizedContentType) warnings.push("optimized_content_type_missing");

  return {
    meta,
    expectsOptimizationMeta: expectsMeta,
    usedOptimizationMeta: true,
    fallbackUsed: false,
    warnings,
  };
}

export function buildUploadGuardrailMeta(params: {
  scope: UploadOptimizationScope;
  contentType: string;
  sizeBytes: number;
  validation: UploadValidationResult;
}) {
  const { scope, contentType, sizeBytes, validation } = params;
  return {
    uploadScope: scope,
    uploadContentType: contentType,
    uploadSizeBytes: sizeBytes,
    expectsOptimizationMeta: validation.expectsOptimizationMeta,
    usedOptimizationMeta: validation.usedOptimizationMeta,
    optimizationFallbackUsed: validation.fallbackUsed,
    optimizationWarnings: validation.warnings,
    optimizationVersion: validation.meta?.optimizationVersion,
    optimizedWidth: validation.meta?.width ?? undefined,
    optimizedHeight: validation.meta?.height ?? undefined,
    optimizedContentType: validation.meta?.optimizedContentType,
  };
}
