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
 * Inkura's rendering model (object-position + scale).
 */
function toFocusZoom(args: { data: Cropper.Data; imgW: number; imgH: number; aspect: number }) {
  const { data, imgW, imgH, aspect } = args;

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
  const zoom = clamp((zoomW + zoomH) / 2, 1, 6);

  return { focusX, focusY, zoom };
}

/**
 * Convert Inkura's focus/zoom back into Cropper.js data (x/y/width/height).
 */
function fromFocusZoom(args: { focusX: number; focusY: number; zoom: number; imgW: number; imgH: number; aspect: number }) {
  const { imgW, imgH, aspect } = args;
  const focusX = clamp(args.focusX, 0, 100);
  const focusY = clamp(args.focusY, 0, 100);
  const zoom = clamp(args.zoom, 1, 6);

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
}: Props) {
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const cropperRef = React.useRef<Cropper | null>(null);

  // "locked" mode renders a stable preview and avoids Cropper re-layout jitter.
  const [locked, setLocked] = React.useState<boolean>(false);

  const valueRef = React.useRef(value);
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Auto-unlock when a new src comes in (new upload / change image).
  React.useEffect(() => {
    if (src) setLocked(false);
    else setLocked(false);
  }, [src]);

  // (Re)create cropper when src changes AND not locked.
  React.useEffect(() => {
    // cleanup old
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }

    const img = imgRef.current;
    if (!img || !src || locked) return;

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

      responsive: true,
      restore: false,

      ready() {
        // Apply external focus/zoom once, then let user adjust freely.
        try {
          const imgData = cropper.getImageData();
          const imgW = Number(imgData?.naturalWidth || 0);
          const imgH = Number(imgData?.naturalHeight || 0);
          if (!imgW || !imgH) return;
          const v = valueRef.current;
          cropper.setData(fromFocusZoom({ focusX: v.focusX, focusY: v.focusY, zoom: v.zoom, imgW, imgH, aspect }) as any);
        } catch {
          // ignore
        }

        if (disabled) {
          try {
            cropper.disable();
          } catch {
            // ignore
          }
        }
      },
    });

    cropperRef.current = cropper;
    return () => {
      cropper.destroy();
      cropperRef.current = null;
    };
  }, [src, aspect, locked, disabled]);

  // Enable/disable Cropper interactions when disabled changes.
  React.useEffect(() => {
    const cropper = cropperRef.current;
    if (!cropper) return;
    try {
      if (disabled) cropper.disable();
      else cropper.enable();
    } catch {
      // ignore
    }
  }, [disabled]);

  const handleReset = () => {
    // Reset should NOT auto-commit. User can press ✅ to apply.
    const cropper = cropperRef.current;

    if (locked) {
      // Reset committed state (explicit action)
      onChange({ focusX: 50, focusY: 50, zoom: 1 });
      return;
    }

    if (cropper) {
      const imgData = cropper.getImageData();
      const imgW = Number(imgData?.naturalWidth || 0);
      const imgH = Number(imgData?.naturalHeight || 0);
      if (imgW && imgH) {
        try {
          cropper.setData(fromFocusZoom({ focusX: 50, focusY: 50, zoom: 1, imgW, imgH, aspect }) as any);
        } catch {
          // ignore
        }
      } else {
        try {
          cropper.reset();
        } catch {
          // ignore
        }
      }
    }
  };

  const handleApplyLock = () => {
    if (!src) return;

    const cropper = cropperRef.current;
    if (!cropper) {
      // If cropper isn't active (shouldn't happen unless locked), just lock.
      setLocked(true);
      return;
    }

    const imgData = cropper.getImageData();
    const imgW = Number(imgData?.naturalWidth || 0);
    const imgH = Number(imgData?.naturalHeight || 0);
    if (!imgW || !imgH) return;

    const data = cropper.getData(true);
    const next = toFocusZoom({ data, imgW, imgH, aspect });

    onChange({
      focusX: round2(next.focusX),
      focusY: round2(next.focusY),
      zoom: round2(next.zoom),
    });

    // Lock immediately so the position won't "move by itself" after user is satisfied.
    setLocked(true);
  };

  const handleUnlock = () => {
    if (!src) return;
    setLocked(false);
  };

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
        {/* Locked preview (stable) */}
        {locked ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="}
            alt=""
            className={"absolute inset-0 w-full h-full object-cover " + (!src ? "opacity-0" : "")}
            draggable={false}
            style={{
              objectPosition: `${value.focusX}% ${value.focusY}%`,
              transform: `scale(${value.zoom})`,
              transformOrigin: "center",
            }}
          />
        ) : (
          // Cropper.js editing image
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={src || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="}
            alt=""
            className={"absolute inset-0 w-full h-full object-cover " + (!src ? "opacity-0" : "")}
            draggable={false}
          />
        )}

        {/* Icon buttons */}
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {onPickImage ? (
            <button
              type="button"
              onClick={() => {
                // Changing image will come with new src and auto-unlock.
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
                setLocked(false);
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
            locked ? (
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
