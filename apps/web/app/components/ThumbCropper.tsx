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

  /** Max zoom clamp (avatar can be higher than chapter thumbs). Default: 6 */
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
 * Inkura's rendering model (object-position + scale).
 */
function toFocusZoom(args: { data: Cropper.Data; imgW: number; imgH: number; aspect: number; maxZoom: number }) {
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
  const zoom = clamp((zoomW + zoomH) / 2, 1, args.maxZoom);

  return { focusX, focusY, zoom };
}

/**
 * Convert Inkura's focus/zoom back into Cropper.js data (x/y/width/height).
 */
function fromFocusZoom(args: { focusX: number; focusY: number; zoom: number; imgW: number; imgH: number; aspect: number; maxZoom: number }) {
  const { imgW, imgH, aspect } = args;
  const focusX = clamp(args.focusX, 0, 100);
  const focusY = clamp(args.focusY, 0, 100);
  const zoom = clamp(args.zoom, 1, args.maxZoom);

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
  maxZoom = 6,
}: Props) {
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const cropperRef = React.useRef<Cropper | null>(null);

  // Editing means Cropper.js is active. Locked means stable preview.
  const [editing, setEditing] = React.useState<boolean>(true);
  const [lockedPreviewSrc, setLockedPreviewSrc] = React.useState<string | null>(null);

  const valueRef = React.useRef(value);
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // When src changes (new upload / change image), open editor again.
  React.useEffect(() => {
    if (src) {
      setEditing(true);
      setLockedPreviewSrc(null);
    } else {
      setEditing(false);
      setLockedPreviewSrc(null);
    }
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

  const createCropperNow = React.useCallback(() => {
    const img = imgRef.current;
    if (!img || !src) return;

    // ensure previous instance gone
    destroyCropperNow();

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
          if (disabled) cropper.disable();
          else cropper.enable();
        } catch {
          // ignore
        }
      },
    });

    cropperRef.current = cropper;
  }, [aspect, destroyCropperNow, disabled, src]);

  // Create/destroy cropper based on "editing".
  React.useEffect(() => {
    const img = imgRef.current;

    if (!editing || !src || !img) {
      destroyCropperNow();
      return;
    }

    const setup = () => createCropperNow();

    // Wait image loaded to avoid later "jump".
    if (img.complete && img.naturalWidth > 0) {
      setup();
      return () => {
        destroyCropperNow();
      };
    }

    img.addEventListener("load", setup, { once: true });
    return () => {
      img.removeEventListener("load", setup as any);
      destroyCropperNow();
    };
  }, [createCropperNow, destroyCropperNow, editing, src]);

  // Enable/disable cropper interactions
  React.useEffect(() => {
    const c = cropperRef.current;
    if (!c) return;
    try {
      if (disabled) c.disable();
      else c.enable();
    } catch {
      // ignore
    }
  }, [disabled]);

  const handleReset = () => {
    if (!src) return;

    const c = cropperRef.current;

    // If we're locked, reset committed state immediately (explicit action).
    if (!editing) {
      onChange({ focusX: 50, focusY: 50, zoom: 1 });
      return;
    }

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

    // Snapshot BEFORE destroying cropper so locked view matches exactly.
    try {
      const targetW = Math.min(1400, Math.max(320, Math.floor(imgW)));
      const targetH = Math.max(1, Math.floor(targetW / aspect));
      const canvas = c.getCroppedCanvas({
        width: targetW,
        height: targetH,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      } as any);
      const url = canvas?.toDataURL("image/jpeg", 0.92);
      if (url) setLockedPreviewSrc(url);
    } catch {
      setLockedPreviewSrc(null);
    }

    onChange({
      focusX: round2(next.focusX),
      focusY: round2(next.focusY),
      zoom: round2(next.zoom),
    });

    // Destroy synchronously BEFORE switching UI to avoid the glitch you recorded.
    destroyCropperNow();
    setEditing(false);
  };

  const handleUnlock = () => {
    if (!src) return;
    setLockedPreviewSrc(null);
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
          style={
            isLocked
              ? {
                  objectPosition: `${value.focusX}% ${value.focusY}%`,
                  transform: `scale(${clamp(value.zoom, 1, maxZoom)})`,
                  transformOrigin: `${value.focusX}% ${value.focusY}%`,
                }
              : undefined
          }
        />

        {isLocked && lockedPreviewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lockedPreviewSrc} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
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
