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

export default function ThumbCropper({
  src,
  value,
  onChange,
  disabled,
  className,
  help,
}: {
  src: string | null;
  value: ThumbCropState;
  onChange: (next: ThumbCropState) => void;
  disabled?: boolean;
  className?: string;
  help?: string;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const drag = React.useRef<{
    active: boolean;
    startX: number;
    startY: number;
    startFocusX: number;
    startFocusY: number;
    pointerId: number | null;
  }>({ active: false, startX: 0, startY: 0, startFocusX: 50, startFocusY: 50, pointerId: null });

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || !src) return;
    const el = ref.current;
    if (!el) return;
    drag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startFocusX: value.focusX,
      startFocusY: value.focusY,
      pointerId: e.pointerId,
    };
    try {
      (e.currentTarget as any).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled || !src) return;
    if (!drag.current.active) return;
    const el = ref.current;
    if (!el) return;

    const r = el.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);

    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;

    // Dragging the image to the right should reveal more of the LEFT side,
    // so we decrease focusX. Same for Y.
    const factor = Math.max(1, value.zoom);
    const nextFocusX = clamp(drag.current.startFocusX - (dx / w) * 100 / factor, 0, 100);
    const nextFocusY = clamp(drag.current.startFocusY - (dy / h) * 100 / factor, 0, 100);

    onChange({ ...value, focusX: nextFocusX, focusY: nextFocusY });
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (drag.current.pointerId != null) {
      try {
        (e.currentTarget as any).releasePointerCapture?.(drag.current.pointerId);
      } catch {
        // ignore
      }
    }
    drag.current.pointerId = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    if (disabled || !src) return;
    // Profile-picture style: scroll to zoom.
    e.preventDefault();
    const dir = e.deltaY > 0 ? -1 : 1;
    const step = e.shiftKey ? 0.1 : 0.05;
    const nextZoom = clamp(Number((value.zoom + dir * step).toFixed(2)), 1, 2.5);
    onChange({ ...value, zoom: nextZoom });
  };

  return (
    <div className={className}>
      <div
        ref={ref}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
        className={
          "relative w-full max-w-[420px] aspect-[4/3] rounded-xl border border-gray-200 dark:border-gray-800 bg-black/5 dark:bg-white/5 overflow-hidden select-none " +
          (disabled ? "opacity-70" : "") +
          (!src ? " flex items-center justify-center" : "")
        }
        aria-label="Thumbnail cropper"
        title={disabled ? undefined : "Drag to move • Scroll to zoom"}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Thumbnail preview"
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

        {src && !disabled ? (
          <div className="absolute bottom-2 left-2 text-[11px] px-2 py-1 rounded-full bg-black/60 text-white">
            Drag to move • Scroll to zoom
          </div>
        ) : null}
      </div>

      {help ? <div className="mt-2 text-[11px] text-gray-600 dark:text-gray-300">{help}</div> : null}
    </div>
  );
}
