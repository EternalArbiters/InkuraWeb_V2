"use client";

import * as React from "react";
import Cropper from "cropperjs";
import { Check, Image as ImageIcon, Pencil, RotateCcw, Trash2 } from "lucide-react";

export type ThumbCropState = {
  focusX: number; // 0..100
  focusY: number; // 0..100
  zoom: number; // >=1
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

  /** max zoom clamp (avatar/profile can be higher; chapter thumbs should match backend clamp, e.g. 2.5) */
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

/**
 * Convert Cropper.js "data" (x/y/width/height in natural image pixels) into
 * Inkura's rendering model (focus as center% + zoom).
 */
function toFocusZoom(args: { data: Cropper.Data; imgW: number; imgH: number; aspect: number; maxZoom: number }) {
  const { data, imgW, imgH, aspect, maxZoom } = args;

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

  const x = clamp(safeNum((data as any).x, 0), 0, Math.max(0, imgW - 1));
  const y = clamp(safeNum((data as any).y, 0), 0, Math.max(0, imgH - 1));
  const w = clamp(safeNum((data as any).width, baseW), 1, imgW);
  const h = clamp(safeNum((data as any).height, baseH), 1, imgH);

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

/**
 * Convert Inkura's focus/zoom back into Cropper.js data (x/y/width/height).
 */
function fromFocusZoom(args: { focusX: number; focusY: number; zoom: number; imgW: number; imgH: number; aspect: number; maxZoom: number }) {
  const { imgW, imgH, aspect, maxZoom } = args;
  const focusX = clamp(args.focusX, 0, 100);
  const focusY = clamp(args.focusY, 0, 100);
  const zoom = clamp(args.zoom, 1, maxZoom);

  const ri = imgW / Math.max(1, imgH);
  const r = aspect;

  let baseW = imgW;
  let baseH = imgH;
  if (ri > r) {
    baseH = imgH;
    baseW = imgH * r;
  } else {
    baseW = imgW;
    baseH = imgW / r;
  }

  const w = clamp(baseW / zoom, 1, imgW);
  const h = clamp(baseH / zoom, 1, imgH);

  const cx = (focusX / 100) * imgW;
  const cy = (focusY / 100) * imgH;

  let x = cx - w / 2;
  let y = cy - h / 2;

  x = clamp(x, 0, Math.max(0, imgW - w));
  y = clamp(y, 0, Math.max(0, imgH - h));

  return { x, y, width: w, height: h };
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
  maxZoom: maxZoomProp,
}: Props) {
  const maxZoom = maxZoomProp ?? 6;

  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const cropperRef = React.useRef<Cropper | null>(null);

  // Editing means user can move/zoom. Locked means frozen view (but Cropper stays mounted to avoid drift).
  const [editing, setEditing] = React.useState<boolean>(true);

  const valueRef = React.useRef(value);
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // When src changes (new upload / change image), open editor again.
  React.useEffect(() => {
    if (src) setEditing(true);
    else setEditing(false);
  }, [src]);

  const destroyCropperNow = React.useCallback(() => {
    const c = cropperRef.current;
    if (c) {
      try {
        c.destroy();
      } catch {
        // ignore
      }
      cropperRef.current = null;
    }
  }, []);

  const ensureCropper = React.useCallback(() => {
    const img = imgRef.current;
    if (!img || !src) return;

    // Recreate if instance exists but src changed underneath (safest: always destroy then create on src change)
    if (cropperRef.current) return;

    const cropper = new Cropper(img, {
      aspectRatio: aspect,
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 1,
      movable: true,
      zoomable: true,
      zoomOnTouch: true,
      zoomOnWheel: true,
      wheelZoomRatio: 0.08,
      cropBoxMovable: false,
      cropBoxResizable: false,
      toggleDragModeOnDblclick: false,

      // hide all chrome via CSS in globals.css
      guides: false,
      center: false,
      highlight: false,
      background: false,
      modal: false,

      // Prevent random reposition on mobile.
      responsive: false,
      restore: false,

      zoom(e) {
        // Clamp zoom live so user can never "lock" an out-of-range ratio.
        try {
          const ratio = Number((e as any)?.detail?.ratio);
          if (!Number.isFinite(ratio)) return;
          if (ratio > maxZoom) {
            (e as any).preventDefault?.();
            cropper.zoomTo(maxZoom);
          } else if (ratio < 1) {
            (e as any).preventDefault?.();
            cropper.zoomTo(1);
          }
        } catch {
          // ignore
        }
      },

      ready() {
        try {
          const imgData = cropper.getImageData();
          const imgW = Number(imgData?.naturalWidth || 0);
          const imgH = Number(imgData?.naturalHeight || 0);
          if (!imgW || !imgH) return;

          const v = valueRef.current;
          cropper.setData(fromFocusZoom({ focusX: v.focusX, focusY: v.focusY, zoom: v.zoom, imgW, imgH, aspect, maxZoom }) as any);
        } catch {
          // ignore
        }

        try {
          // Editing state wins; then apply disabled.
          if (!editing || disabled) cropper.disable();
          else cropper.enable();
        } catch {
          // ignore
        }
      },
    });

    cropperRef.current = cropper;
  }, [aspect, disabled, editing, maxZoom, src]);

  // Create/destroy cropper only when src disappears/changes; do NOT destroy on lock.
  React.useEffect(() => {
    const img = imgRef.current;

    if (!src || !img) {
      destroyCropperNow();
      return;
    }

    // If src changed, we need a fresh instance bound to the new image.
    destroyCropperNow();

    const setup = () => ensureCropper();

    if (img.complete && img.naturalWidth > 0) {
      setup();
      return;
    }

    img.addEventListener("load", setup, { once: true });
    return () => {
      img.removeEventListener("load", setup as any);
    };
  }, [destroyCropperNow, ensureCropper, src]);

  // Enable/disable cropper interactions based on editing/disabled.
  React.useEffect(() => {
    const c = cropperRef.current;
    if (!c) return;
    try {
      if (!editing || disabled) c.disable();
      else c.enable();
    } catch {
      // ignore
    }
  }, [disabled, editing]);

  // If parent updates value while locked (e.g. form reset / server reload), re-apply to cropper.
  React.useEffect(() => {
    const c = cropperRef.current;
    if (!c || !src) return;
    if (editing) return;

    try {
      const imgData = c.getImageData();
      const imgW = Number(imgData?.naturalWidth || 0);
      const imgH = Number(imgData?.naturalHeight || 0);
      if (!imgW || !imgH) return;
      c.setData(fromFocusZoom({ focusX: value.focusX, focusY: value.focusY, zoom: value.zoom, imgW, imgH, aspect, maxZoom }) as any);
    } catch {
      // ignore
    }
  }, [aspect, editing, maxZoom, src, value.focusX, value.focusY, value.zoom]);

  const handleReset = () => {
    if (!src) return;

    const c = cropperRef.current;

    // Explicit reset should update committed state AND the visible crop (even if locked).
    onChange({ focusX: 50, focusY: 50, zoom: 1 });

    if (!c) return;

    try {
      const imgData = c.getImageData();
      const imgW = Number(imgData?.naturalWidth || 0);
      const imgH = Number(imgData?.naturalHeight || 0);
      if (imgW && imgH) {
        c.setData(fromFocusZoom({ focusX: 50, focusY: 50, zoom: 1, imgW, imgH, aspect, maxZoom }) as any);
      } else {
        c.reset();
      }
    } catch {
      // ignore
    }
  };

  const handleApplyLock = () => {
    if (!src) return;
    const c = cropperRef.current;
    if (!c) {
      setEditing(false);
      return;
    }

    const imgData = c.getImageData();
    const imgW = Number(imgData?.naturalWidth || 0);
    const imgH = Number(imgData?.naturalHeight || 0);
    if (!imgW || !imgH) return;

    const data = c.getData(true);
    const next = toFocusZoom({ data, imgW, imgH, aspect, maxZoom });

    onChange({
      focusX: round2(next.focusX),
      focusY: round2(next.focusY),
      zoom: round2(next.zoom),
    });

    // Freeze view WITHOUT re-rendering a different preview implementation.
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
        {/* Single image node (never unmounted) to prevent Cropper.js DOM glitches */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="}
          alt=""
          className={"absolute inset-0 w-full h-full object-cover " + (!src ? "opacity-0" : "")}
          draggable={false}
        />

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
                destroyCropperNow();
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
