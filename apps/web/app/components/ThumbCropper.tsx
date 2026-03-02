"use client";

import * as React from "react";
import Cropper from "cropperjs";
import { Check, Image as ImageIcon, Pencil, RotateCcw, Trash2 } from "lucide-react";

export type ThumbCropState = {
  focusX: number; // 0..100
  focusY: number; // 0..100
  zoom: number;   // >=1
};

type Props = {
  src: string | null;
  value: ThumbCropState;
  onChange: (next: ThumbCropState) => void;
  disabled?: boolean;
  className?: string;
  onPickImage?: () => void;
  onRemoveImage?: () => void;
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

function toFocusZoom(args: { data: Cropper.Data; imgW: number; imgH: number; aspect: number }) {
  const { data, imgW, imgH, aspect } = args;

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

  const x = clamp(safeNum((data as any).x, 0), 0, Math.max(0, imgW - 1));
  const y = clamp(safeNum((data as any).y, 0), 0, Math.max(0, imgH - 1));
  const w = clamp(safeNum((data as any).width, baseW), 1, imgW);
  const h = clamp(safeNum((data as any).height, baseH), 1, imgH);

  const cx = x + w / 2;
  const cy = y + h / 2;

  const focusX = clamp((cx / Math.max(1, imgW)) * 100, 0, 100);
  const focusY = clamp((cy / Math.max(1, imgH)) * 100, 0, 100);

  const zoomW = baseW / Math.max(1e-6, w);
  const zoomH = baseH / Math.max(1e-6, h);
  const zoom = clamp((zoomW + zoomH) / 2, 1, 6);

  return { focusX, focusY, zoom, _debug: { baseW, baseH, cropW: w, cropH: h, zoomW, zoomH } };
}

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
  const [editing, setEditing] = React.useState<boolean>(true);
  const [lockedDataUrl, setLockedDataUrl] = React.useState<string | null>(null);

  // DEBUG: store the last committed values to display on screen
  const [debugInfo, setDebugInfo] = React.useState<string | null>(null);

  const valueRef = React.useRef(value);
  React.useEffect(() => { valueRef.current = value; }, [value]);

  const aspectRef = React.useRef(aspect);
  React.useEffect(() => { aspectRef.current = aspect; }, [aspect]);

  React.useEffect(() => {
    if (src) {
      setLockedDataUrl(null);
      setDebugInfo(null);
      setEditing(true);
    } else {
      setLockedDataUrl(null);
      setDebugInfo(null);
      setEditing(false);
    }
  }, [src]);

  const destroyCropperNow = React.useCallback(() => {
    const c = cropperRef.current;
    if (c) {
      try { c.destroy(); } catch { /* ignore */ }
      cropperRef.current = null;
    }
  }, []);

  const createCropperNow = React.useCallback(() => {
    const img = imgRef.current;
    if (!img || !src) return;
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
      guides: false,
      center: false,
      highlight: false,
      background: false,
      modal: false,
      responsive: false,
      restore: false,

      ready() {
        try {
          const imgData = cropper.getImageData();
          const imgW = Number(imgData?.naturalWidth || 0);
          const imgH = Number(imgData?.naturalHeight || 0);
          if (!imgW || !imgH) return;
          const v = valueRef.current;
          const asp = aspectRef.current;
          cropper.setData(
            fromFocusZoom({ focusX: v.focusX, focusY: v.focusY, zoom: v.zoom, imgW, imgH, aspect: asp }) as any
          );
        } catch { /* ignore */ }
        try {
          if (disabled) cropper.disable();
          else cropper.enable();
        } catch { /* ignore */ }
      },
    });

    cropperRef.current = cropper;
  }, [aspect, destroyCropperNow, disabled, src]);

  React.useEffect(() => {
    const img = imgRef.current;
    if (!editing || !src || !img) {
      destroyCropperNow();
      return;
    }
    const setup = () => createCropperNow();
    if (img.complete && img.naturalWidth > 0) {
      setup();
      return () => { destroyCropperNow(); };
    }
    img.addEventListener("load", setup, { once: true });
    return () => {
      img.removeEventListener("load", setup as any);
      destroyCropperNow();
    };
  }, [createCropperNow, destroyCropperNow, editing, src]);

  React.useEffect(() => {
    const c = cropperRef.current;
    if (!c) return;
    try {
      if (disabled) c.disable();
      else c.enable();
    } catch { /* ignore */ }
  }, [disabled]);

  const handleReset = () => {
    if (!src) return;
    if (!editing) {
      setLockedDataUrl(null);
      setDebugInfo(null);
      onChange({ focusX: 50, focusY: 50, zoom: 1 });
      setEditing(true);
      return;
    }
    const c = cropperRef.current;
    if (!c) return;
    try {
      const imgData = c.getImageData();
      const imgW = Number(imgData?.naturalWidth || 0);
      const imgH = Number(imgData?.naturalHeight || 0);
      if (imgW && imgH) {
        c.setData(fromFocusZoom({ focusX: 50, focusY: 50, zoom: 1, imgW, imgH, aspect }) as any);
      } else {
        c.reset();
      }
    } catch { /* ignore */ }
  };

  const handleApplyLock = () => {
    if (!src) return;
    const c = cropperRef.current;
    if (!c) { setEditing(false); return; }

    const imgData = c.getImageData();
    const imgW = Number(imgData?.naturalWidth || 0);
    const imgH = Number(imgData?.naturalHeight || 0);
    if (!imgW || !imgH) return;

    // Snapshot exact pixels from Cropper before destroying
    let snapshotUrl: string | null = null;
    try {
      const canvas = c.getCroppedCanvas({
        maxWidth: 840,
        maxHeight: 840,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: "high",
      });
      snapshotUrl = canvas.toDataURL("image/jpeg", 0.92);
    } catch { /* ignore */ }

    const data = c.getData(true);
    const next = toFocusZoom({ data, imgW, imgH, aspect });

    // DEBUG info to show on screen
    const dbg = `img:${imgW}×${imgH} aspect:${aspect.toFixed(2)}
base:${round2((next as any)._debug?.baseW)}×${round2((next as any)._debug?.baseH)}
crop:${round2((next as any)._debug?.cropW)}×${round2((next as any)._debug?.cropH)}
zoomW:${round2((next as any)._debug?.zoomW)} zoomH:${round2((next as any)._debug?.zoomH)}
→ focusX:${round2(next.focusX)} focusY:${round2(next.focusY)} zoom:${round2(next.zoom)}
snapshot:${snapshotUrl ? "OK" : "FAIL"}`;

    destroyCropperNow();

    if (snapshotUrl) setLockedDataUrl(snapshotUrl);
    setDebugInfo(dbg);

    onChange({
      focusX: round2(next.focusX),
      focusY: round2(next.focusY),
      zoom: round2(next.zoom),
    });

    setEditing(false);
  };

  const handleUnlock = () => {
    if (!src) return;
    setLockedDataUrl(null);
    setDebugInfo(null);
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
        {/* Locked preview: exact pixel snapshot from getCroppedCanvas */}
        {isLocked && lockedDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lockedDataUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}

        {/* Cropper.js image node — hidden when locked */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
          style={{ opacity: isLocked || !src ? 0 : 1 }}
        />

        {/* DEBUG OVERLAY — shows values on screen so you can screenshot them */}
        {isLocked && debugInfo ? (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "rgba(0,0,0,0.75)",
              color: "#0f0",
              fontSize: 10,
              fontFamily: "monospace",
              padding: "4px 6px",
              whiteSpace: "pre",
              zIndex: 20,
              lineHeight: 1.4,
            }}
          >
            {debugInfo}
          </div>
        ) : null}

        {/* Toolbar */}
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
              onClick={() => {
                destroyCropperNow();
                setLockedDataUrl(null);
                setDebugInfo(null);
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
