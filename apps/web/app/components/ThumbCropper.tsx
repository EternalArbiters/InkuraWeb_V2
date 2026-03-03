"use client";

import * as React from "react";
import EasyCrop from "react-easy-crop";
import { Check, Image as ImageIcon, Pencil, RotateCcw, Trash2 } from "lucide-react";

export type ThumbCropState = {
  /** Percent (0..100). Used across the app for object-position style rendering. */
  focusX: number;
  /** Percent (0..100). Used across the app for object-position style rendering. */
  focusY: number;
  /** >= 1 */
  zoom: number;
};

type Props = {
  src: string | null;
  value: ThumbCropState;

  /**
   * IMPORTANT:
   * onChange is ONLY called when user presses the ✅ (apply/lock) button
   * (so the crop won't "auto-save" while you are still adjusting).
   */
  onChange: (next: ThumbCropState) => void;

  disabled?: boolean;
  className?: string;

  onPickImage?: () => void;
  onRemoveImage?: () => void;

  /** target aspect ratio; chapter thumb default 4/3, avatar default 1 */
  aspect?: number;

  /**
   * Max zoom clamp.
   * - avatar/profile: 6
   * - chapter thumbnail: 2.5 (matches backend clamp)
   */
  maxZoom?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
function safeNum(v: unknown, def: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}

type RectPx = { x: number; y: number; width: number; height: number };

/**
 * Convert a crop rectangle (x/y/width/height in natural image pixels) into
 * Inkura's focus/zoom model (object-position + scale).
 */
function toFocusZoom(args: { rect: RectPx; imgW: number; imgH: number; aspect: number; maxZoom: number }) {
  const { rect, imgW, imgH, aspect, maxZoom } = args;

  const ri = imgW / Math.max(1, imgH);
  const r = aspect;

  // Base crop region (zoom=1) for object-fit: cover at ratio r.
  let baseW = imgW;
  let baseH = imgH;
  if (ri > r) {
    // Image is wider → cover by height.
    baseH = imgH;
    baseW = imgH * r;
  } else {
    // Image is taller → cover by width.
    baseW = imgW;
    baseH = imgW / r;
  }

  const x = clamp(safeNum(rect.x, 0), 0, Math.max(0, imgW - 1));
  const y = clamp(safeNum(rect.y, 0), 0, Math.max(0, imgH - 1));
  const w = clamp(safeNum(rect.width, baseW), 1, imgW);
  const h = clamp(safeNum(rect.height, baseH), 1, imgH);

  const cx = x + w / 2;
  const cy = y + h / 2;

  const focusX = clamp((cx / Math.max(1, imgW)) * 100, 0, 100);
  const focusY = clamp((cy / Math.max(1, imgH)) * 100, 0, 100);

  // Zoom relative to the "cover" baseline. (>=1)
  const zoomW = baseW / Math.max(1e-6, w);
  const zoomH = baseH / Math.max(1e-6, h);
  const zoom = clamp((zoomW + zoomH) / 2, 1, maxZoom);

  return { focusX, focusY, zoom };
}

export default function ThumbCropper({
  src,
  value,
  onChange,
  disabled,
  className,
  onPickImage,
  onRemoveImage,
  aspect = 4 / 3,
  maxZoom = 6,
}: Props) {
  // Editing means interactions enabled. Locked means frozen view.
  const [editing, setEditing] = React.useState<boolean>(true);

  // react-easy-crop state
  const [crop, setCrop] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState<number>(clamp(value.zoom, 1, maxZoom));

  // Track media (natural) size; used to compute focus/zoom on lock.
  const mediaRef = React.useRef<{ w: number; h: number } | null>(null);
  const lastRectRef = React.useRef<RectPx | null>(null);

  const valueRef = React.useRef(value);
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // When src changes (new upload / change image), open editor again and reset local state.
// IMPORTANT: we intentionally do NOT re-initialize local crop position on every `value` change,
// because parent updates (after pressing ✅) would otherwise "snap" the crop back to center.
React.useEffect(() => {
  if (!src) {
    setEditing(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    mediaRef.current = null;
    lastRectRef.current = null;
    return;
  }

  setEditing(true);

  // Start near the persisted focus/zoom (approx).
  // Exact focus/zoom is computed from `croppedAreaPixels` only when user presses ✅.
  const persisted = valueRef.current;
  const z = clamp(persisted.zoom, 1, maxZoom);
  setZoom(z);
  setCrop({
    x: (50 - clamp(persisted.focusX, 0, 100)) * z,
    y: (50 - clamp(persisted.focusY, 0, 100)) * z,
  });
}, [src, maxZoom]);


  const handleReset = () => {
    if (!src) return;

    // Reset UI immediately.
    setCrop({ x: 0, y: 0 });
    setZoom(1);

    // If we're locked, reset committed state immediately (explicit action).
    if (!editing) onChange({ focusX: 50, focusY: 50, zoom: 1 });
  };

  const handleApplyLock = () => {
    if (!src) return;
    const m = mediaRef.current;
    const rect = lastRectRef.current;
    if (!m || !rect) {
      // If crop not ready yet, just lock UI.
      setEditing(false);
      return;
    }

    const next = toFocusZoom({ rect, imgW: m.w, imgH: m.h, aspect, maxZoom });
    onChange({ focusX: round2(next.focusX), focusY: round2(next.focusY), zoom: round2(next.zoom) });
    setEditing(false);
  };

  const handleUnlock = () => {
    if (!src) return;
    setEditing(true);
  };

  const isLocked = !!src && !editing;

  return (
    <div className={className}>
      <div
        className={
          "inkura-cropper relative w-full max-w-[420px] rounded-xl border border-gray-200 dark:border-gray-800 bg-black/5 dark:bg-white/5 overflow-hidden select-none " +
          (disabled ? "opacity-70" : "")
        }
        style={{ aspectRatio: String(aspect) }}
        aria-label="Image cropper"
      >
        {src ? (
          // Note: react-easy-crop does not expose a `disabled` prop.
          // We disable user interaction via `pointer-events: none` and by gating state updates.
          <div
            className="absolute inset-0"
            style={{ pointerEvents: disabled || isLocked ? "none" : "auto" }}
          >
            <EasyCrop
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={(next) => {
                if (disabled || isLocked) return;
                setCrop(next);
              }}
              onZoomChange={(z) => {
                if (disabled || isLocked) return;
                setZoom(clamp(z, 1, maxZoom));
              }}
              onMediaLoaded={(mediaSize) => {
                // react-easy-crop passes { width, height, naturalWidth, naturalHeight }
                const w = Number((mediaSize as any).naturalWidth || (mediaSize as any).width || 0);
                const h = Number((mediaSize as any).naturalHeight || (mediaSize as any).height || 0);
                if (w > 0 && h > 0) mediaRef.current = { w, h };
              }}
              onCropComplete={(_croppedArea, croppedAreaPixels) => {
                if (!croppedAreaPixels) return;
                lastRectRef.current = {
                  x: safeNum((croppedAreaPixels as any).x, 0),
                  y: safeNum((croppedAreaPixels as any).y, 0),
                  width: safeNum((croppedAreaPixels as any).width, 0),
                  height: safeNum((croppedAreaPixels as any).height, 0),
                };
              }}
              cropShape="rect"
              showGrid={false}
              classes={{
                containerClassName: "absolute inset-0",
                mediaClassName: "select-none",
              }}
            />
          </div>
        ) : null}

        {/* Icon buttons */}
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {onPickImage ? (
            <button
              type="button"
              onClick={() => {
                onPickImage();
              }}
              disabled={!!disabled}
              className="h-9 w-9 rounded-full bg-black/55 text-white backdrop-blur border border-white/10 hover:bg-black/70 flex items-center justify-center disabled:opacity-60"
              title="Change image"
              aria-label="Change image"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleReset}
            disabled={!!disabled || !src}
            className="h-9 w-9 rounded-full bg-black/55 text-white backdrop-blur border border-white/10 hover:bg-black/70 flex items-center justify-center disabled:opacity-60"
            title="Reset"
            aria-label="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {onRemoveImage ? (
            <button
              type="button"
              onClick={() => {
                onRemoveImage();
                setEditing(false);
              }}
              disabled={!!disabled || !src}
              className="h-9 w-9 rounded-full bg-black/55 text-white backdrop-blur border border-white/10 hover:bg-black/70 flex items-center justify-center disabled:opacity-60"
              title="Remove"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}

          {/* ✅ Apply/Lock (and ✏️ Unlock/Edit) */}
          {src ? (
            isLocked ? (
              <button
                type="button"
                onClick={handleUnlock}
                disabled={!!disabled}
                className="h-9 w-9 rounded-full bg-emerald-500/85 text-white backdrop-blur border border-white/10 hover:bg-emerald-500 flex items-center justify-center disabled:opacity-60"
                title="Edit position"
                aria-label="Edit position"
              >
                <Pencil className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyLock}
                disabled={!!disabled}
                className="h-9 w-9 rounded-full bg-emerald-500/85 text-white backdrop-blur border border-white/10 hover:bg-emerald-500 flex items-center justify-center disabled:opacity-60"
                title="Apply & Lock"
                aria-label="Apply & Lock"
              >
                <Check className="h-4 w-4" />
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
