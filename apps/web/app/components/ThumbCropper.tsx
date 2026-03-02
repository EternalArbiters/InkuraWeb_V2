"use client";

import * as React from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type ThumbCropState = {
  focusX: number; // 0..100 (object-position semantics)
  focusY: number; // 0..100
  zoom: number; // 1..2.5
};

function coverDisplayedSize(frameW: number, frameH: number, imgW: number, imgH: number) {
  const iw = Math.max(1, imgW);
  const ih = Math.max(1, imgH);
  const scale = Math.max(frameW / iw, frameH / ih);
  return {
    dispW: iw * scale,
    dispH: ih * scale,
  };
}

function focusToShift(focus: number, maxShift: number) {
  if (maxShift <= 0) return 0;
  // Keep compatibility with CSS object-position:
  // focus=0  => left/top aligned => image center shifted +maxShift
  // focus=50 => centered         => 0
  // focus=100=> right/bottom     => -maxShift
  const f = clamp(focus, 0, 100);
  const n = (50 - f) / 50; // 1..-1
  return n * maxShift;
}

function shiftToFocus(shift: number, maxShift: number) {
  if (maxShift <= 0) return 50;
  const n = clamp(shift / maxShift, -1, 1);
  return clamp(50 - n * 50, 0, 100);
}

export default function ThumbCropper({
  src,
  value,
  onChange,
  disabled,
  className,
  help,
  aspectClassName,
  frameClassName,
  roundedClassName,
  showGuides = true,
}: {
  src: string | null;
  value: ThumbCropState;
  onChange: (next: ThumbCropState) => void;
  disabled?: boolean;
  className?: string;
  help?: string;
  /** Tailwind aspect class. Defaults to 4/3 (chapter thumbs). */
  aspectClassName?: string;
  /** Extra classes for the frame wrapper. */
  frameClassName?: string;
  /** Tailwind rounding class for the frame. Defaults to rounded-xl. */
  roundedClassName?: string;
  /** Show 3x3 grid + corner marks (Instagram-like). */
  showGuides?: boolean;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  // Natural image size (needed to compute true "cover" overflow). If not ready yet, we fall back.
  const [nat, setNat] = React.useState<{ w: number; h: number } | null>(null);
  React.useEffect(() => {
    setNat(null);
  }, [src]);

  // Active pointers (drag + pinch)
  const pointers = React.useRef(new Map<number, { x: number; y: number }>());

  const gesture = React.useRef<
    | null
    | {
        mode: "drag" | "pinch";
        // Drag
        startX: number;
        startY: number;
        startShiftX: number;
        startShiftY: number;
        // Zoom
        startZoom: number;
        startDist?: number;
        startMidX?: number;
        startMidY?: number;
      }
  >(null);

  const getFrame = React.useCallback(() => {
    const el = ref.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    const cx = r.left + w / 2;
    const cy = r.top + h / 2;
    return { r, w, h, cx, cy };
  }, []);

  const getCover = React.useCallback(
    (frameW: number, frameH: number) => {
      // Fallback so interactions still work before onLoad.
      const iw = nat?.w ?? frameW;
      const ih = nat?.h ?? frameH;
      return coverDisplayedSize(frameW, frameH, iw, ih);
    },
    [nat]
  );

  const getMaxShift = React.useCallback(
    (frameW: number, frameH: number, zoom: number) => {
      const { dispW, dispH } = getCover(frameW, frameH);
      const scaledW = dispW * zoom;
      const scaledH = dispH * zoom;
      const overflowX = Math.max(0, scaledW - frameW);
      const overflowY = Math.max(0, scaledH - frameH);
      return { maxX: overflowX / 2, maxY: overflowY / 2 };
    },
    [getCover]
  );

  const applyShift = React.useCallback(
    (frameW: number, frameH: number, shiftX: number, shiftY: number, zoom: number) => {
      const { maxX, maxY } = getMaxShift(frameW, frameH, zoom);
      const sx = clamp(shiftX, -maxX, maxX);
      const sy = clamp(shiftY, -maxY, maxY);
      const focusX = shiftToFocus(sx, maxX);
      const focusY = shiftToFocus(sy, maxY);
      onChange({
        focusX,
        focusY,
        zoom: clamp(Number(zoom.toFixed(2)), 1, 2.5),
      });
    },
    [getMaxShift, onChange]
  );

  const beginDrag = React.useCallback(
    (e: React.PointerEvent) => {
      const frame = getFrame();
      if (!frame) return;
      const { w, h } = frame;
      const z = clamp(value.zoom, 1, 2.5);
      const { maxX, maxY } = getMaxShift(w, h, z);

      gesture.current = {
        mode: "drag",
        startX: e.clientX,
        startY: e.clientY,
        startShiftX: focusToShift(value.focusX, maxX),
        startShiftY: focusToShift(value.focusY, maxY),
        startZoom: z,
      };
    },
    [getFrame, getMaxShift, value.focusX, value.focusY, value.zoom]
  );

  const beginPinch = React.useCallback(() => {
    const frame = getFrame();
    if (!frame) return;
    const pts = Array.from(pointers.current.values());
    if (pts.length < 2) return;

    const [a, b] = pts;
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;

    const { w, h } = frame;
    const z = clamp(value.zoom, 1, 2.5);
    const { maxX, maxY } = getMaxShift(w, h, z);

    gesture.current = {
      mode: "pinch",
      startX: 0,
      startY: 0,
      startShiftX: focusToShift(value.focusX, maxX),
      startShiftY: focusToShift(value.focusY, maxY),
      startZoom: z,
      startDist: Math.max(1, dist),
      startMidX: midX,
      startMidY: midY,
    };
  }, [getFrame, getMaxShift, value.focusX, value.focusY, value.zoom]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || !src) return;

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    if (pointers.current.size >= 2) beginPinch();
    else beginDrag(e);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled || !src) return;
    if (!pointers.current.has(e.pointerId)) return;

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const frame = getFrame();
    if (!frame) return;
    const { w, h, cx, cy } = frame;

    const g = gesture.current;
    if (!g) return;

    if (g.mode === "pinch" && pointers.current.size >= 2) {
      const pts = Array.from(pointers.current.values());
      const [a, b] = pts;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const scale = dist / (g.startDist || 1);
      const nextZoom = clamp(Number((g.startZoom * scale).toFixed(2)), 1, 2.5);

      // Zoom around pinch midpoint (Instagram-like)
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const px = midX - cx;
      const py = midY - cy;
      const ratio = nextZoom / Math.max(1e-6, g.startZoom);

      const nextShiftX = g.startShiftX * ratio + px * (1 - ratio);
      const nextShiftY = g.startShiftY * ratio + py * (1 - ratio);

      applyShift(w, h, nextShiftX, nextShiftY, nextZoom);
      return;
    }

    if (g.mode === "drag") {
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;

      const nextShiftX = g.startShiftX + dx;
      const nextShiftY = g.startShiftY + dy;

      applyShift(w, h, nextShiftX, nextShiftY, g.startZoom);
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);

    try {
      (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    // If we drop from pinch to one pointer, continue as drag using the remaining pointer.
    if (pointers.current.size === 1 && src && !disabled) {
      const only = Array.from(pointers.current.values())[0];
      // Re-init drag baseline using *current* state.
      const frame = getFrame();
      if (!frame) return;
      const { w, h } = frame;
      const z = clamp(value.zoom, 1, 2.5);
      const { maxX, maxY } = getMaxShift(w, h, z);
      gesture.current = {
        mode: "drag",
        startX: only.x,
        startY: only.y,
        startShiftX: focusToShift(value.focusX, maxX),
        startShiftY: focusToShift(value.focusY, maxY),
        startZoom: z,
      };
      return;
    }

    if (pointers.current.size === 0) gesture.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (disabled || !src) return;
    e.preventDefault();

    const frame = getFrame();
    if (!frame) return;
    const { w, h, cx, cy } = frame;

    const dir = e.deltaY > 0 ? -1 : 1;
    const step = e.shiftKey ? 0.1 : 0.05;
    const curZoom = clamp(value.zoom, 1, 2.5);
    const nextZoom = clamp(Number((curZoom + dir * step).toFixed(2)), 1, 2.5);

    // Zoom around cursor point (Instagram-like)
    const px = e.clientX - cx;
    const py = e.clientY - cy;
    const ratio = nextZoom / Math.max(1e-6, curZoom);

    const { maxX, maxY } = getMaxShift(w, h, curZoom);
    const curShiftX = focusToShift(value.focusX, maxX);
    const curShiftY = focusToShift(value.focusY, maxY);

    const nextShiftX = curShiftX * ratio + px * (1 - ratio);
    const nextShiftY = curShiftY * ratio + py * (1 - ratio);

    applyShift(w, h, nextShiftX, nextShiftY, nextZoom);
  };

  const aspect = aspectClassName || "aspect-[4/3]";
  const rounding = roundedClassName || "rounded-xl";

  return (
    <div className={className}>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={onWheel}
        className={
          "relative w-full max-w-[420px] " +
          aspect +
          " " +
          rounding +
          " border border-gray-200 dark:border-gray-800 bg-black/5 dark:bg-white/5 overflow-hidden select-none touch-none " +
          (disabled ? "opacity-70 " : "") +
          (!src ? " flex items-center justify-center" : "") +
          " " +
          (frameClassName || "")
        }
        aria-label="Image cropper"
        title={disabled ? undefined : "Drag to move • Scroll/Pinch to zoom"}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Preview"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: `${clamp(value.focusX, 0, 100)}% ${clamp(value.focusY, 0, 100)}%`,
              transform: `scale(${clamp(value.zoom, 1, 2.5)})`,
              transformOrigin: "center",
            }}
            onLoad={(e) => {
              const img = e.currentTarget;
              const w = img.naturalWidth || 1;
              const h = img.naturalHeight || 1;
              setNat((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
            }}
            draggable={false}
          />
        ) : (
          <div className="text-xs text-gray-500">Auto</div>
        )}

        {src && showGuides ? (
          <div className="absolute inset-0 pointer-events-none">
            {/* 3x3 grid */}
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />

            {/* Corner brackets */}
            <div className="absolute inset-0">
              <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-white/80" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-white/80" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-white/80" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-white/80" />
            </div>
          </div>
        ) : null}

        {src && !disabled ? (
          <div className="absolute bottom-2 left-2 text-[11px] px-2 py-1 rounded-full bg-black/60 text-white">
            Drag to move • Scroll/Pinch to zoom
          </div>
        ) : null}
      </div>

      {help ? <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300">{help}</div> : null}
    </div>
  );
}
