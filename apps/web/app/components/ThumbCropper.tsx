"use client";

import * as React from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type ThumbCropState = {
  focusX: number; // 0..100
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

  // Natural image size (helps decide when an axis can't move at zoom=1 because there's no overflow)
  const imgNatural = React.useRef<{ w: number; h: number } | null>(null);
  React.useEffect(() => {
    imgNatural.current = null;
    if (!src) return;

    const img = new Image();
    img.decoding = "async";
    img.src = src;
    img.onload = () => {
      imgNatural.current = {
        w: img.naturalWidth || 1,
        h: img.naturalHeight || 1,
      };
    };
  }, [src]);

  // Track active pointers for drag + pinch.
  const pointers = React.useRef(new Map<number, { x: number; y: number }>());
  const gesture = React.useRef<
    | null
    | {
        mode: "drag" | "pinch";
        startX: number;
        startY: number;
        startFocusX: number;
        startFocusY: number;
        startZoom: number;
        startDist?: number;
      }
  >(null);

  const beginDrag = (e: React.PointerEvent) => {
    gesture.current = {
      mode: "drag",
      startX: e.clientX,
      startY: e.clientY,
      startFocusX: value.focusX,
      startFocusY: value.focusY,
      startZoom: value.zoom,
    };
  };

  const beginPinch = () => {
    const pts = Array.from(pointers.current.values());
    if (pts.length < 2) return;
    const [a, b] = pts;
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    gesture.current = {
      mode: "pinch",
      startX: 0,
      startY: 0,
      startFocusX: value.focusX,
      startFocusY: value.focusY,
      startZoom: value.zoom,
      startDist: Math.max(1, dist),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || !src) return;

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    try {
      (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    if (pointers.current.size >= 2) {
      beginPinch();
    } else {
      beginDrag(e);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled || !src) return;
    if (!pointers.current.has(e.pointerId)) return;

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);

    const g = gesture.current;
    if (!g) return;

    // Pinch zoom (mobile)
    if (g.mode === "pinch" && pointers.current.size >= 2) {
      const pts = Array.from(pointers.current.values());
      const [a, b] = pts;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const scale = dist / (g.startDist || 1);
      const nextZoom = clamp(Number((g.startZoom * scale).toFixed(2)), 1, 2.5);
      onChange({ ...value, zoom: nextZoom });
      return;
    }

    // Drag move
    if (g.mode === "drag") {
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;

      // Use at least the gesture start zoom even if parent state hasn't re-rendered yet.
      const zoomNow = clamp(Math.max(value.zoom, g.startZoom), 1, 2.5);

      // If the image has NO overflow on an axis at the current zoom,
      // dragging that axis will look like "stuck" (common for portrait photos inside square crop).
      // To make it feel like Instagram, we auto-bump zoom a tiny bit when user tries to drag on that axis.
      const nat = imgNatural.current;
      if (nat) {
        const { dispW, dispH } = coverDisplayedSize(w, h, nat.w, nat.h);
        const overflowX = dispW * zoomNow - w;
        const overflowY = dispH * zoomNow - h;

        let neededZoom = zoomNow;
        const wantX = Math.abs(dx) > 2;
        const wantY = Math.abs(dy) > 2;

        if (wantX && overflowX < 2) {
          // Ensure ~2px overflow so X movement becomes possible
          neededZoom = Math.max(neededZoom, (w + 2) / Math.max(1, dispW));
        }
        if (wantY && overflowY < 2) {
          neededZoom = Math.max(neededZoom, (h + 2) / Math.max(1, dispH));
        }

        // Small extra bump so it feels responsive
        if (neededZoom > zoomNow && neededZoom < 1.05) neededZoom = 1.05;
        neededZoom = clamp(Number(neededZoom.toFixed(2)), 1, 2.5);

        if (neededZoom !== zoomNow) {
          // Restart baseline so drag continues smoothly on next move.
          gesture.current = {
            mode: "drag",
            startX: e.clientX,
            startY: e.clientY,
            startFocusX: value.focusX,
            startFocusY: value.focusY,
            startZoom: neededZoom,
          };
          onChange({ ...value, zoom: neededZoom });
          return;
        }
      }

      // Dragging the image to the right should reveal more of the LEFT side,
      // so we decrease focusX. Same for Y.
      const factor = Math.max(1, zoomNow);
      const nextFocusX = clamp(g.startFocusX - (dx / w) * (100 / factor), 0, 100);
      const nextFocusY = clamp(g.startFocusY - (dy / h) * (100 / factor), 0, 100);

      onChange({ ...value, focusX: nextFocusX, focusY: nextFocusY, zoom: zoomNow });
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
      gesture.current = {
        mode: "drag",
        startX: only.x,
        startY: only.y,
        startFocusX: value.focusX,
        startFocusY: value.focusY,
        startZoom: value.zoom,
      };
      return;
    }

    if (pointers.current.size === 0) {
      gesture.current = null;
    }
  };

  const onWheel = (e: React.WheelEvent) => {
    if (disabled || !src) return;
    // Scroll to zoom.
    e.preventDefault();
    const dir = e.deltaY > 0 ? -1 : 1;
    const step = e.shiftKey ? 0.1 : 0.05;
    const nextZoom = clamp(Number((value.zoom + dir * step).toFixed(2)), 1, 2.5);
    onChange({ ...value, zoom: nextZoom });
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
              objectPosition: `${value.focusX}% ${value.focusY}%`,
              transform: `scale(${value.zoom})`,
              transformOrigin: "center",
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
