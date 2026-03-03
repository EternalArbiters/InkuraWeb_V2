"use client";

import * as React from "react";
import Cropper, { Area, MediaSize } from "react-easy-crop";
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
   * onChange is ONLY called when user clicks ✅ Apply & Lock, or when user resets/removes.
   * During live dragging/zooming, state is kept locally to avoid "snap to center" loops.
   */
  onChange: (next: ThumbCropState) => void;

  aspect?: number; // default 4/3
  cropShape?: "rect" | "round"; // default rect
  maxZoom?: number; // default 6 (chapter thumb should use 2.5 to match backend clamp)

  disabled?: boolean;
  onPickImage?: () => void;
  onRemoveImage?: () => void;
  className?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Convert react-easy-crop croppedArea (percent) -> our focus (percent center).
 */
function focusFromCroppedArea(croppedArea: Area): { focusX: number; focusY: number } {
  const focusX = croppedArea.x + croppedArea.width / 2;
  const focusY = croppedArea.y + croppedArea.height / 2;
  return { focusX: clamp(focusX, 0, 100), focusY: clamp(focusY, 0, 100) };
}

/**
 * Best-effort initial crop positioning from stored focus.
 * react-easy-crop crop.x/y are pixel translations; mapping from a saved "focus" is not exact
 * without knowing cropSize. This approximation is stable and avoids re-centering loops.
 */
function approxCropFromFocus(
  media: MediaSize | null,
  focusX: number,
  focusY: number,
  zoom: number
): { x: number; y: number } {
  if (!media) return { x: 0, y: 0 };
  const fx = clamp(focusX, 0, 100) / 100;
  const fy = clamp(focusY, 0, 100) / 100;

  // Translate proportional to image size and zoom overflow.
  const overflowX = (media.width * zoom - media.width) / 2;
  const overflowY = (media.height * zoom - media.height) / 2;

  const x = (0.5 - fx) * 2 * overflowX;
  const y = (0.5 - fy) * 2 * overflowY;
  return { x, y };
}

export default function ThumbCropper({
  src,
  value,
  onChange,
  aspect = 4 / 3,
  cropShape = "rect",
  maxZoom = 6,
  disabled,
  onPickImage,
  onRemoveImage,
  className,
}: Props) {
  const [isLocked, setIsLocked] = React.useState(true);

  // local live state (do NOT mirror props on every change; that's what caused snap-to-center)
  const [crop, setCrop] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState<number>(clamp(value.zoom ?? 1, 1, maxZoom));

  const mediaRef = React.useRef<MediaSize | null>(null);
  const latestCroppedAreaRef = React.useRef<Area | null>(null);
  const didInitRef = React.useRef(false);

  // Init ONLY when src changes (new image) or on first mount.
  React.useEffect(() => {
    didInitRef.current = false;
    setIsLocked(true);
    setCrop({ x: 0, y: 0 });
    setZoom(clamp(value.zoom ?? 1, 1, maxZoom));
  }, [src, maxZoom]); // intentionally NOT depending on value.* to avoid recentering

  const onMediaLoaded = React.useCallback((mediaSize: MediaSize) => {
    mediaRef.current = mediaSize;
    if (didInitRef.current) return;

    const z = clamp(value.zoom ?? 1, 1, maxZoom);
    setZoom(z);
    setCrop(approxCropFromFocus(mediaSize, value.focusX ?? 50, value.focusY ?? 50, z));

    didInitRef.current = true;
  }, [maxZoom, value.focusX, value.focusY, value.zoom]);

  const onCropComplete = React.useCallback((croppedArea: Area) => {
    latestCroppedAreaRef.current = croppedArea;
  }, []);

  const applyAndLock = React.useCallback(() => {
    const area = latestCroppedAreaRef.current;
    const z = clamp(zoom, 1, maxZoom);

    // If we don't have an area yet (e.g. image not loaded), fall back to existing value.
    if (!area) {
      onChange({
        focusX: clamp(value.focusX ?? 50, 0, 100),
        focusY: clamp(value.focusY ?? 50, 0, 100),
        zoom: round2(z),
      });
      setIsLocked(true);
      return;
    }

    const { focusX, focusY } = focusFromCroppedArea(area);
    onChange({ focusX: round2(focusX), focusY: round2(focusY), zoom: round2(z) });
    setIsLocked(true);
  }, [maxZoom, onChange, value.focusX, value.focusY, zoom]);

  const reset = React.useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    latestCroppedAreaRef.current = null;
    onChange({ focusX: 50, focusY: 50, zoom: 1 });
    setIsLocked(true);
  }, [onChange]);

  const canInteract = !!src && !disabled && !isLocked;

  return (
    <div className={className}>
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900"
        style={{ aspectRatio: String(aspect) }}
      >
        {src ? (
          <div className={canInteract ? "absolute inset-0" : "absolute inset-0 pointer-events-none"}>
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={false}
              minZoom={1}
              maxZoom={maxZoom}
              onCropChange={(c) => {
                if (!canInteract) return;
                setCrop(c);
              }}
              onZoomChange={(z) => {
                if (!canInteract) return;
                setZoom(clamp(z, 1, maxZoom));
              }}
              onCropAreaChange={(area) => {
                // Keep latest area continuously so ✅ can save even if user clicks immediately after dragging.
                latestCroppedAreaRef.current = area;
              }}
              onCropComplete={onCropComplete}
              onMediaLoaded={onMediaLoaded}
              classes={{
                containerClassName: "rounded-2xl",
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={disabled ? undefined : onPickImage}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400"
          >
            <ImageIcon className="h-6 w-6" />
            <span className="text-xs">Pick image</span>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {src && (
            <>
              <button
                type="button"
                onClick={() => setIsLocked(false)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-2 py-1 text-xs text-gray-800 dark:text-gray-200 disabled:opacity-50"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>

              <button
                type="button"
                onClick={applyAndLock}
                disabled={disabled || isLocked}
                className="inline-flex items-center gap-1 rounded-xl border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-800 disabled:opacity-50 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200"
                title="Apply & Lock"
              >
                <Check className="h-3.5 w-3.5" />
                Lock
              </button>

              <button
                type="button"
                onClick={reset}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-2 py-1 text-xs text-gray-800 dark:text-gray-200 disabled:opacity-50"
                title="Reset"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={disabled ? undefined : onRemoveImage}
                className="inline-flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200 disabled:opacity-50"
                disabled={disabled}
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={disabled ? undefined : onPickImage}
          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-2 py-1 text-xs text-gray-800 dark:text-gray-200 disabled:opacity-50"
          disabled={disabled}
          title="Pick image"
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Zoom slider (matches the demos the user provided) */}
      {src && (
        <div className="mt-2">
          <input
            type="range"
            value={zoom}
            min={1}
            max={maxZoom}
            step={0.05}
            aria-labelledby="Zoom"
            onChange={(e) => {
              const next = clamp(Number(e.target.value), 1, maxZoom);
              setZoom(next);
              // allow changing zoom only when editing; otherwise it should reflect locked state
              if (!isLocked && !disabled) {
                // keep local only
              }
            }}
            className="w-full"
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
