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

  /** max zoom clamp (avatar default 6; chapter thumbs should pass 2.5 to match backend) */
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
  const { data, imgW, imgH, aspect, maxZoom } = args;

  // We store focusX/focusY as CSS `object-position` percentages (0..100),
  // not "image center" percentages. This makes the locked preview match Cropper.js exactly.
  //
  // Locked preview model:
  // - container ratio = aspect
  // - image uses `object-fit: cover`
  // - then we apply `transform: scale(zoom)` with origin at object-position
  //
  // Cropper.js gives us the visible crop rect in NATURAL pixels: (x, y, width, height).
  // We convert that rect into:
  // - zoom: how much tighter than the baseline "cover" view
  // - object-position: how the image is aligned inside the container

  const r = aspect;

  // Base visible region (zoom=1) in NATURAL pixels for object-fit: cover at ratio r.
  const ri = imgW / Math.max(1, imgH);
  let baseW = imgW;
  let baseH = imgH;
  if (ri > r) {
    // image is wider -> cover by height
    baseH = imgH;
    baseW = imgH * r;
  } else {
    // image is taller -> cover by width
    baseW = imgW;
    baseH = imgW / r;
  }

  const x = clamp(safeNum((data as any).x, 0), 0, Math.max(0, imgW - 1));
  const y = clamp(safeNum((data as any).y, 0), 0, Math.max(0, imgH - 1));
  const w = clamp(safeNum((data as any).width, baseW), 1, imgW);
  const h = clamp(safeNum((data as any).height, baseH), 1, imgH);

  // Zoom relative to the "cover baseline" (>=1).
  // Cropper rect (w,h) should match (baseW/baseH) scaled by 1/zoom.
  const zoom = clamp(baseW / Math.max(1e-6, w), 1, maxZoom);

  // Compute cover scale `s` in arbitrary units (container width = r, height = 1).
  // This matches CSS object-fit: cover.
  const cw = r;
  const ch = 1;
  const s = Math.max(cw / Math.max(1, imgW), ch / Math.max(1, imgH)); // cover scale
  const rw = imgW * s * zoom;
  const rh = imgH * s * zoom;

  // CSS object-position uses: offset = (container - rendered) * p
  // We want container-left to correspond to natural-x, i.e.:
  //   naturalX_at_containerLeft = (-offsetX) / (s*zoom) = x
  // => offsetX = -x*s*zoom
  // => pX = offsetX / (cw - rw)
  const denomX = cw - rw;
  const denomY = ch - rh;

  const pX = denomX === 0 ? 0.5 : clamp((-x * s * zoom) / denomX, 0, 1);
  const pY = denomY === 0 ? 0.5 : clamp((-y * s * zoom) / denomY, 0, 1);

  return {
    focusX: pX * 100,
    focusY: pY * 100,
    zoom,
  };
}

/**
 * Convert Inkura's object-position + zoom back into Cropper.js data (x/y/width/height).
 */
function fromFocusZoom(args: { focusX: number; focusY: number; zoom: number; imgW: number; imgH: number; aspect: number; maxZoom: number }) {
  const { imgW, imgH, aspect, maxZoom } = args;
  const focusX = clamp(args.focusX, 0, 100);
  const focusY = clamp(args.focusY, 0, 100);
  const zoom = clamp(args.zoom, 1, maxZoom);

  const r = aspect;

  // Same cover geometry assumptions as toFocusZoom (container width=r, height=1)
  const cw = r;
  const ch = 1;
  const s = Math.max(cw / Math.max(1, imgW), ch / Math.max(1, imgH));

  const rw = imgW * s * zoom;
  const rh = imgH * s * zoom;

  const pX = focusX / 100;
  const pY = focusY / 100;

  const ox = (cw - rw) * pX; // rendered offset in container-units
  const oy = (ch - rh) * pY;

  // Visible rect in NATURAL pixels
  const w = clamp(cw / Math.max(1e-6, s * zoom), 1, imgW);
  const h = clamp(ch / Math.max(1e-6, s * zoom), 1, imgH);

  let x = (-ox) / Math.max(1e-6, s * zoom);
  let y = (-oy) / Math.max(1e-6, s * zoom);

  x = clamp(x, 0, Math.max(0, imgW - w));
  y = clamp(y, 0, Math.max(0, imgH - h));

  return { x, y, width: w, height: h };
};
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
                  transform: `scale(${value.zoom})`,
                  transformOrigin: `${value.focusX}% ${value.focusY}%`,
                }
              : undefined
          }
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
