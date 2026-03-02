"use client";

import * as React from "react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export type ThumbCropState = {
  /** Stored as 0..100 (compatible with existing DB). We reinterpret it as pan position, not CSS object-position. */
  focusX: number;
  /** Stored as 0..100 (compatible with existing DB). We reinterpret it as pan position, not CSS object-position. */
  focusY: number;
  /** 1..2.5 (user zoom multiplier) */
  zoom: number;
};

function coverScale(frameW: number, frameH: number, imgW: number, imgH: number) {
  const iw = Math.max(1, imgW);
  const ih = Math.max(1, imgH);
  return Math.max(frameW / iw, frameH / ih);
}

function maxPan(frameW: number, frameH: number, imgW: number, imgH: number, zoom: number) {
  const s = coverScale(frameW, frameH, imgW, imgH) * zoom;
  const scaledW = imgW * s;
  const scaledH = imgH * s;
  return {
    x: Math.max(0, (scaledW - frameW) / 2),
    y: Math.max(0, (scaledH - frameH) / 2),
  };
}

// focus 50 => centered pan 0. focus 0 => pan +max. focus 100 => pan -max.
function focusToPan(focus: number, maxShift: number) {
  if (maxShift <= 0) return 0;
  const f = clamp(focus, 0, 100);
  return ((50 - f) / 50) * maxShift;
}

function panToFocus(pan: number, maxShift: number) {
  if (maxShift <= 0) return 50;
  const n = clamp(pan / maxShift, -1, 1);
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
  /** Show 3x3 grid + corner marks (Android/IG-like). */
  showGuides?: boolean;
}) {
  const frameRef = React.useRef<HTMLDivElement | null>(null);

  const [frame, setFrame] = React.useState<{ w: number; h: number; left: number; top: number } | null>(null);
  const [nat, setNat] = React.useState<{ w: number; h: number } | null>(null);

  // Keep frame size fresh (responsive).
  React.useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    const update = () => {
      const r = el.getBoundingClientRect();
      setFrame({ w: Math.max(1, r.width), h: Math.max(1, r.height), left: r.left, top: r.top });
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  React.useEffect(() => {
    // reset nat when src changes
    setNat(null);
  }, [src]);

  const safeZoom = clamp(Number((value.zoom || 1).toFixed(2)), 1, 2.5);

  const bounds = React.useMemo(() => {
    if (!frame || !nat) return { maxX: 0, maxY: 0, scale: 1 };
    const m = maxPan(frame.w, frame.h, nat.w, nat.h, safeZoom);
    // Rendering uses object-cover at zoom=1, so scale here is just the user zoom.
    return { maxX: m.x, maxY: m.y, scale: safeZoom };
  }, [frame, nat, safeZoom]);

  // Derived pan in pixels (clamped). Rendering uses this directly.
  const pan = React.useMemo(() => {
    const px = focusToPan(value.focusX, bounds.maxX);
    const py = focusToPan(value.focusY, bounds.maxY);
    return {
      x: clamp(px, -bounds.maxX, bounds.maxX),
      y: clamp(py, -bounds.maxY, bounds.maxY),
    };
  }, [value.focusX, value.focusY, bounds.maxX, bounds.maxY]);

  // If stored focus is out of range for current bounds (e.g., resizing), auto-correct once.
  React.useEffect(() => {
    if (disabled || !src) return;
    if (!frame || !nat) return;

    const correctedX = panToFocus(pan.x, bounds.maxX);
    const correctedY = panToFocus(pan.y, bounds.maxY);

    const dx = Math.abs(correctedX - value.focusX);
    const dy = Math.abs(correctedY - value.focusY);

    if (dx > 0.01 || dy > 0.01) {
      onChange({ ...value, focusX: correctedX, focusY: correctedY });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds.maxX, bounds.maxY, pan.x, pan.y, frame?.w, frame?.h, nat?.w, nat?.h, src]);

  // Pointer handling (drag + pinch)
  const pointers = React.useRef(new Map<number, { x: number; y: number }>());
  const gesture = React.useRef<
    | null
    | {
        mode: "drag" | "pinch";
        startPanX: number;
        startPanY: number;
        startZoom: number;
        startDist?: number;
        startMid?: { x: number; y: number }; // relative to frame center
      }
  >(null);

  const getCenter = React.useCallback(() => {
    if (!frame) return null;
    return { cx: frame.left + frame.w / 2, cy: frame.top + frame.h / 2 };
  }, [frame]);

  const applyPanZoom = React.useCallback(
    (nextPanX: number, nextPanY: number, nextZoom: number) => {
      if (!frame || !nat) {
        // Still allow zoom update even before load.
        onChange({ ...value, zoom: clamp(Number(nextZoom.toFixed(2)), 1, 2.5) });
        return;
      }

      const z = clamp(Number(nextZoom.toFixed(2)), 1, 2.5);
      const m = maxPan(frame.w, frame.h, nat.w, nat.h, z);

      const px = clamp(nextPanX, -m.x, m.x);
      const py = clamp(nextPanY, -m.y, m.y);

      onChange({
        focusX: panToFocus(px, m.x),
        focusY: panToFocus(py, m.y),
        zoom: z,
      });
    },
    [frame, nat, onChange, value]
  );

  const beginDrag = React.useCallback(() => {
    gesture.current = {
      mode: "drag",
      startPanX: pan.x,
      startPanY: pan.y,
      startZoom: safeZoom,
    };
  }, [pan.x, pan.y, safeZoom]);

  const beginPinch = React.useCallback(() => {
    if (!frame) return;
    const pts = Array.from(pointers.current.values());
    if (pts.length < 2) return;
    const [a, b] = pts;
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    const center = getCenter();
    if (!center) return;

    const midClientX = (a.x + b.x) / 2;
    const midClientY = (a.y + b.y) / 2;

    gesture.current = {
      mode: "pinch",
      startPanX: pan.x,
      startPanY: pan.y,
      startZoom: safeZoom,
      startDist: Math.max(1, dist),
      startMid: { x: midClientX - center.cx, y: midClientY - center.cy },
    };
  }, [frame, getCenter, pan.x, pan.y, safeZoom]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || !src) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    if (pointers.current.size >= 2) beginPinch();
    else beginDrag();
  };

  // Drag: keep per-pointer previous position to compute dx/dy
  const lastPos = React.useRef(new Map<number, { x: number; y: number }>());

  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled || !src) return;
    if (!pointers.current.has(e.pointerId)) return;

    const prev = lastPos.current.get(e.pointerId) || { x: e.clientX, y: e.clientY };
    lastPos.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const g = gesture.current;
    if (!g || !frame) return;

    if (g.mode === "pinch" && pointers.current.size >= 2) {
      const pts = Array.from(pointers.current.values());
      const [a, b] = pts;
      const dist = Math.hypot(b.x - a.x, b.y - a.y);
      const center = getCenter();
      if (!center) return;

      const nextZoom = clamp(g.startZoom * (dist / (g.startDist || 1)), 1, 2.5);
      const ratio = nextZoom / Math.max(1e-6, g.startZoom);

      const midClientX = (a.x + b.x) / 2;
      const midClientY = (a.y + b.y) / 2;
      const anchorX = midClientX - center.cx;
      const anchorY = midClientY - center.cy;

      const nextPanX = g.startPanX * ratio + anchorX * (1 - ratio);
      const nextPanY = g.startPanY * ratio + anchorY * (1 - ratio);

      applyPanZoom(nextPanX, nextPanY, nextZoom);
      return;
    }

    if (g.mode === "drag") {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      const nextPanX = g.startPanX + dx;
      const nextPanY = g.startPanY + dy;
      // Update gesture baseline so dragging stays smooth frame-to-frame
      g.startPanX = nextPanX;
      g.startPanY = nextPanY;
      applyPanZoom(nextPanX, nextPanY, g.startZoom);
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    lastPos.current.delete(e.pointerId);
    try {
      (e.currentTarget as any).releasePointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }

    // If leaving pinch and one pointer remains, continue drag from current state.
    if (pointers.current.size === 1 && !disabled && src) {
      gesture.current = {
        mode: "drag",
        startPanX: pan.x,
        startPanY: pan.y,
        startZoom: safeZoom,
      };
      return;
    }

    if (pointers.current.size >= 2) {
      beginPinch();
      return;
    }

    if (pointers.current.size === 0) gesture.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (disabled || !src) return;
    e.preventDefault();

    const curZoom = safeZoom;
    const dir = e.deltaY > 0 ? -1 : 1;
    const step = e.shiftKey ? 0.1 : 0.05;
    const nextZoom = clamp(Number((curZoom + dir * step).toFixed(2)), 1, 2.5);

    const center = getCenter();
    if (!center) {
      applyPanZoom(pan.x, pan.y, nextZoom);
      return;
    }

    // anchor zoom at cursor location (relative to frame center)
    const anchorX = e.clientX - center.cx;
    const anchorY = e.clientY - center.cy;
    const ratio = nextZoom / Math.max(1e-6, curZoom);

    const nextPanX = pan.x * ratio + anchorX * (1 - ratio);
    const nextPanY = pan.y * ratio + anchorY * (1 - ratio);

    applyPanZoom(nextPanX, nextPanY, nextZoom);
  };

  const aspect = aspectClassName || "aspect-[4/3]";
  const rounding = roundedClassName || "rounded-xl";

  return (
    <div className={className}>
      <div
        ref={frameRef}
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
          <div className="absolute inset-0">
            {/* Pan wrapper (pixels, NOT scaled). */}
            <div className="absolute inset-0" style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt="Preview"
                draggable={false}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  const w = img.naturalWidth || 1;
                  const h = img.naturalHeight || 1;
                  setNat((prev) => (prev && prev.w === w && prev.h === h ? prev : { w, h }));
                }}
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  transform: `scale(${bounds.scale})`,
                  transformOrigin: "center",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            </div>

            {showGuides ? (
              <div className="absolute inset-0 pointer-events-none">
                {/* dim outside feel (subtle) */}
                <div className="absolute inset-0 bg-black/10" />

                {/* 3x3 grid */}
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />

                {/* Corner brackets */}
                <div className="absolute inset-0">
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-white/90" />
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-white/90" />
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-white/90" />
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-white/90" />
                </div>

                {/* Center dot */}
                <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
              </div>
            ) : null}

            {!disabled ? (
              <div className="absolute bottom-2 left-2 text-[11px] px-2 py-1 rounded-full bg-black/60 text-white">
                Drag to move • Scroll/Pinch to zoom
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-xs text-gray-500">Auto</div>
        )}
      </div>

      {help ? <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300">{help}</div> : null}
    </div>
  );
}
