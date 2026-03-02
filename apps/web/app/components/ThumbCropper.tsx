"use client";

import * as React from "react";
import Cropper from "cropperjs";
import { Image as ImageIcon, RotateCcw, Trash2 } from "lucide-react";

export type ThumbCropState = {
  focusX: number; // 0..100
  focusY: number; // 0..100
  zoom: number; // >=1
};

type Props = {
  src: string | null;
  value: ThumbCropState;
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

/**
 * Convert Cropper.js "data" (x/y/width/height in natural image pixels) into
 * Inkura's rendering model (object-position + scale).
 */
function toFocusZoom(args: {
  data: Cropper.Data;
  imgW: number;
  imgH: number;
  aspect: number;
}) {
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
  // Use the more stable of the two (they should be ~equal).
  const zoom = clamp((zoomW + zoomH) / 2, 1, 6);

  return { focusX, focusY, zoom };
}

/**
 * Convert Inkura's focus/zoom back into Cropper.js data (x/y/width/height).
 */
function fromFocusZoom(args: {
  focusX: number;
  focusY: number;
  zoom: number;
  imgW: number;
  imgH: number;
  aspect: number;
}) {
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
  const rafRef = React.useRef<number | null>(null);
  const applyingExternalRef = React.useRef(false);

  const commit = React.useCallback(() => {
    const cropper = cropperRef.current;
    if (!cropper) return;
    const imgData = cropper.getImageData();
    const imgW = Number(imgData?.naturalWidth || 0);
    const imgH = Number(imgData?.naturalHeight || 0);
    if (!imgW || !imgH) return;
    const data = cropper.getData(true);
    const next = toFocusZoom({ data, imgW, imgH, aspect });
    onChange({ focusX: next.focusX, focusY: next.focusY, zoom: next.zoom });
  }, [aspect, onChange]);

  const scheduleCommit = React.useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      if (applyingExternalRef.current) return;
      commit();
    });
  }, [commit]);

  // (Re)create cropper when src changes.
  React.useEffect(() => {
    // cleanup old
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }

    const img = imgRef.current;
    if (!img || !src) return;

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
      guides: false,
      center: false,
      highlight: false,
      background: false,
      modal: false,
      responsive: true,
      restore: false,
      ready() {
        // Apply external focus/zoom.
        try {
          const imgData = cropper.getImageData();
          const imgW = Number(imgData?.naturalWidth || 0);
          const imgH = Number(imgData?.naturalHeight || 0);
          if (!imgW || !imgH) return;
          applyingExternalRef.current = true;
          cropper.setData(
            fromFocusZoom({
              focusX: value.focusX,
              focusY: value.focusY,
              zoom: value.zoom,
              imgW,
              imgH,
              aspect,
            }) as any
          );
        } finally {
          applyingExternalRef.current = false;
        }
        scheduleCommit();
      },
      crop() {
        scheduleCommit();
      },
    });

    cropperRef.current = cropper;
    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      cropper.destroy();
      cropperRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, aspect]);

  // Apply external changes (e.g. parent reset).
  React.useEffect(() => {
    const cropper = cropperRef.current;
    if (!cropper || !src) return;
    const imgData = cropper.getImageData();
    const imgW = Number(imgData?.naturalWidth || 0);
    const imgH = Number(imgData?.naturalHeight || 0);
    if (!imgW || !imgH) return;
    try {
      applyingExternalRef.current = true;
      cropper.setData(
        fromFocusZoom({
          focusX: value.focusX,
          focusY: value.focusY,
          zoom: value.zoom,
          imgW,
          imgH,
          aspect,
        }) as any
      );
    } finally {
      applyingExternalRef.current = false;
    }
    scheduleCommit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.focusX, value.focusY, value.zoom]);

  const handleReset = () => {
    const cropper = cropperRef.current;
    if (cropper) {
      // Reset to default center, zoom=1
      const imgData = cropper.getImageData();
      const imgW = Number(imgData?.naturalWidth || 0);
      const imgH = Number(imgData?.naturalHeight || 0);
      if (imgW && imgH) {
        try {
          applyingExternalRef.current = true;
          cropper.setData(fromFocusZoom({ focusX: 50, focusY: 50, zoom: 1, imgW, imgH, aspect }) as any);
        } finally {
          applyingExternalRef.current = false;
        }
      }
    }
    onChange({ focusX: 50, focusY: 50, zoom: 1 });
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
        {/* Cropper.js needs a real <img>. Keep it mounted even when src is null. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="}
          alt=""
          className={"absolute inset-0 w-full h-full object-cover " + (!src ? "opacity-0" : "")}
          draggable={false}
        />

        {/* 3 icon buttons only */}
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {onPickImage ? (
            <button
              type="button"
              onClick={onPickImage}
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
              onClick={onRemoveImage}
              disabled={!!disabled || !src}
              className="h-9 w-9 rounded-full bg-black/55 text-white backdrop-blur border border-white/10 hover:bg-black/70 flex items-center justify-center disabled:opacity-60"
              title="Remove"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
