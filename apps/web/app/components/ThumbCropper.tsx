"use client";

import * as React from "react";
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.css";
import { Check, Image as ImageIcon, Pencil, RotateCcw, Trash2 } from "lucide-react";

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
  aspect?: number;
  maxZoom?: number;
};

// --- Utils ---
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
 * Konversi data Cropper ke format state kita (Focus & Zoom)
 */
function toFocusZoom(args: { data: Cropper.Data; imgW: number; imgH: number; aspect: number; maxZoom: number }) {
  const { data, imgW, imgH, aspect } = args;

  const w = clamp(safeNum(data.width, imgW), 1, imgW);
  const h = clamp(safeNum(data.height, imgH), 1, imgH);
  const x = safeNum(data.x, 0);
  const y = safeNum(data.y, 0);

  // Hitung baseline zoom (cover)
  const ri = imgW / Math.max(1, imgH);
  const r = aspect;
  let baseW = imgW;
  if (ri > r) {
    baseW = imgH * r;
  }

  const zoom = clamp(baseW / w, 1, args.maxZoom);

  // Fokus adalah titik tengah dari area crop dalam persen (0-100)
  const focusX = clamp(((x + w / 2) / imgW) * 100, 0, 100);
  const focusY = clamp(((y + h / 2) / imgH) * 100, 0, 100);

  return { focusX, focusY, zoom };
}

/**
 * Konversi state kita balik ke koordinat Cropper
 */
function fromFocusZoom(args: { focusX: number; focusY: number; zoom: number; imgW: number; imgH: number; aspect: number; maxZoom: number }) {
  const { imgW, imgH, aspect, focusX, focusY, zoom } = args;

  const ri = imgW / Math.max(1, imgH);
  const r = aspect;
  let baseW = imgW, baseH = imgH;
  if (ri > r) { baseW = imgH * r; } else { baseH = imgW / r; }

  const w = baseW / zoom;
  const h = baseH / zoom;

  const x = (focusX / 100) * imgW - w / 2;
  const y = (focusY / 100) * imgH - h / 2;

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
  
  // Default editing true jika ada src tapi belum ada value (zoom=1)
  const [editing, setEditing] = React.useState<boolean>(true);

  // Gunakan ref untuk value agar listener cropper selalu dapat data terbaru
  const valueRef = React.useRef(value);
  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const destroyCropper = React.useCallback(() => {
    if (cropperRef.current) {
      cropperRef.current.destroy();
      cropperRef.current = null;
    }
  }, []);

  const initCropper = React.useCallback(() => {
    const img = imgRef.current;
    if (!img || !src) return;

    destroyCropper();

    const cropper = new Cropper(img, {
      aspectRatio: aspect,
      viewMode: 1,
      dragMode: "move",
      autoCropArea: 1,
      cropBoxMovable: false,
      cropBoxResizable: false,
      toggleDragModeOnDblclick: false,
      guides: false,
      center: false,
      highlight: false,
      background: false,
      modal: false,
      responsive: false,
      ready() {
        const imgData = cropper.getImageData();
        const initialData = fromFocusZoom({
          ...valueRef.current,
          imgW: imgData.naturalWidth,
          imgH: imgData.naturalHeight,
          aspect,
          maxZoom
        });
        cropper.setData(initialData);
      },
    });

    cropperRef.current = cropper;
  }, [src, aspect, maxZoom, destroyCropper]);

  // Effect untuk menangani mount/unmount cropper
  React.useEffect(() => {
    if (editing && src) {
      const img = imgRef.current;
      if (img) {
        if (img.complete) initCropper();
        else img.addEventListener("load", initCropper, { once: true });
      }
    } else {
      destroyCropper();
    }
    return () => destroyCropper();
  }, [editing, src, initCropper, destroyCropper]);

  const handleApply = () => {
    if (!cropperRef.current) return;
    
    const c = cropperRef.current;
    const data = c.getData(true);
    const imgData = c.getImageData();

    const next = toFocusZoom({
      data,
      imgW: imgData.naturalWidth,
      imgH: imgData.naturalHeight,
      aspect,
      maxZoom
    });

    onChange({
      focusX: round2(next.focusX),
      focusY: round2(next.focusY),
      zoom: round2(next.zoom),
    });
    
    setEditing(false);
  };

  const handleReset = () => {
    if (!editing) {
      onChange({ focusX: 50, focusY: 50, zoom: 1 });
    } else if (cropperRef.current) {
      cropperRef.current.reset();
      const imgData = cropperRef.current.getImageData();
      cropperRef.current.setData(fromFocusZoom({
        focusX: 50, focusY: 50, zoom: 1,
        imgW: imgData.naturalWidth,
        imgH: imgData.naturalHeight,
        aspect, maxZoom
      }));
    }
  };

  const isLocked = !!src && !editing;

  return (
    <div className={className}>
      <div 
        className={
          "relative w-full max-w-[420px] rounded-xl border border-gray-200 dark:border-gray-800 bg-black/5 overflow-hidden select-none " + 
          (disabled ? "opacity-70" : "")
        }
        style={{ aspectRatio: String(aspect) }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src || "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="}
          alt=""
          className={"absolute inset-0 w-full h-full object-cover " + (!src ? "opacity-0" : "")}
          draggable={false}
          style={isLocked ? {
            objectPosition: `${value.focusX}% ${value.focusY}%`,
            transform: `scale(${value.zoom})`,
            transformOrigin: "center", // Kunci di tengah agar tidak lari saat scale
          } : undefined}
        />

        {/* Controls Overlay */}
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          {onPickImage && (
            <button
              type="button"
              onClick={onPickImage}
              className="h-9 w-9 rounded-full bg-black/55 text-white backdrop-blur border border-white/10 hover:bg-black/70 flex items-center justify-center"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="h-9 w-9 rounded-full bg-black/55 text-white backdrop-blur border border-white/10 hover:bg-black/70 flex items-center justify-center"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {src && (
            <button
              type="button"
              onClick={() => (editing ? handleApply() : setEditing(true))}
              disabled={disabled}
              className="h-9 w-9 rounded-full bg-emerald-500/90 text-white shadow-lg flex items-center justify-center hover:bg-emerald-500"
            >
              {editing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </button>
          )}

          {onRemoveImage && (
            <button
              type="button"
              onClick={() => { destroyCropper(); onRemoveImage(); setEditing(false); }}
              className="h-9 w-9 rounded-full bg-red-500/20 text-red-600 hover:bg-red-500/40 flex items-center justify-center"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}