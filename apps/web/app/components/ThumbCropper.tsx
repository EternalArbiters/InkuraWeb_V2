"use client";

import * as React from "react";
import Cropper, { MediaSize } from "react-easy-crop";
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
   * NOTE (Fix for "edited thumbnail not saved"):
   * This component now calls onChange while the user is editing (drag/zoom),
   * so the parent form state stays in sync even if the user clicks "Save"
   * without pressing "Lock".
   */
  onChange: (next: ThumbCropState) => void;

  aspect?: number; // default 4/3
  cropShape?: "rect" | "round"; // default rect
  maxZoom?: number; // default 2.5 (matches backend clamp for chapter thumbnails)

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
 * Convert react-easy-crop's translation (crop.x/y) + zoom -> focus (0..100).
 * Deterministic and doesn't depend on cropSize, good enough for our stored "focus".
 */
function focusFromCrop(media: MediaSize | null, crop: { x: number; y: number }, zoom: number) {
  if (!media) return { focusX: 50, focusY: 50 };
  const z = Math.max(1, zoom);

  const overflowX = (media.width * z - media.width) / 2;
  const overflowY = (media.height * z - media.height) / 2;

  const fx = overflowX > 0 ? 0.5 - crop.x / (2 * overflowX) : 0.5;
  const fy = overflowY > 0 ? 0.5 - crop.y / (2 * overflowY) : 0.5;

  return {
    focusX: clamp(fx * 100, 0, 100),
    focusY: clamp(fy * 100, 0, 100),
  };
}

/**
 * Best-effort initial crop positioning from stored focus.
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
  maxZoom = 2.5,
  disabled,
  onPickImage,
  onRemoveImage,
  className,
}: Props) {
  // "Locked" view is default (prevents accidental drags), but edits are now saved LIVE while editing.
  const [isEditing, setIsEditing] = React.useState(false);

  const [crop, setCrop] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState<number>(clamp(value.zoom ?? 1, 1, maxZoom));

  const mediaRef = React.useRef<MediaSize | null>(null);
  const didInitRef = React.useRef(false);

  // Refs for debounced commits
  const cropRef = React.useRef(crop);
  const zoomRef = React.useRef(zoom);
  const lastSentRef = React.useRef<ThumbCropState>({
    focusX: Number.isFinite(value.focusX) ? value.focusX : 50,
    focusY: Number.isFinite(value.focusY) ? value.focusY : 50,
    zoom: Number.isFinite(value.zoom) ? value.zoom : 1,
  });

  React.useEffect(() => {
    cropRef.current = crop;
  }, [crop]);

  React.useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // Init ONLY when src changes (new image) or first mount.
  React.useEffect(() => {
    didInitRef.current = false;
    setIsEditing(false);
    setCrop({ x: 0, y: 0 });
    setZoom(clamp(value.zoom ?? 1, 1, maxZoom));
    // keep lastSent in sync with incoming props on new image
    lastSentRef.current = {
      focusX: Number.isFinite(value.focusX) ? value.focusX : 50,
      focusY: Number.isFinite(value.focusY) ? value.focusY : 50,
      zoom: Number.isFinite(value.zoom) ? value.zoom : 1,
    };
  }, [src, maxZoom]); // intentionally NOT depending on value.* (avoids recenter loops)

  const onMediaLoaded = React.useCallback(
    (mediaSize: MediaSize) => {
      mediaRef.current = mediaSize;
      if (didInitRef.current) return;

      const z = clamp(value.zoom ?? 1, 1, maxZoom);
      setZoom(z);
      setCrop(approxCropFromFocus(mediaSize, value.focusX ?? 50, value.focusY ?? 50, z));

      didInitRef.current = true;
    },
    [maxZoom, value.focusX, value.focusY, value.zoom]
  );

  const commitNow = React.useCallback(() => {
    const z = clamp(zoomRef.current, 1, maxZoom);
    const { focusX, focusY } = focusFromCrop(mediaRef.current, cropRef.current, z);

    const next: ThumbCropState = { focusX: round2(focusX), focusY: round2(focusY), zoom: round2(z) };

    const prev = lastSentRef.current;
    // tiny tolerance to avoid spamming parent state
    const changed =
      Math.abs((prev.focusX ?? 0) - next.focusX) > 0.01 ||
      Math.abs((prev.focusY ?? 0) - next.focusY) > 0.01 ||
      Math.abs((prev.zoom ?? 0) - next.zoom) > 0.01;

    if (!changed) return;

    lastSentRef.current = next;
    onChange(next);
  }, [maxZoom, onChange]);

  // Throttled commit while dragging/zooming (at most once per animation frame)
  const rafRef = React.useRef<number | null>(null);
  const queueCommit = React.useCallback(() => {
    if (!isEditing || disabled) return;
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      commitNow();
    });
  }, [commitNow, disabled, isEditing]);

  React.useEffect(() => {
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const reset = React.useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    lastSentRef.current = { focusX: 50, focusY: 50, zoom: 1 };
    onChange({ focusX: 50, focusY: 50, zoom: 1 });
    setIsEditing(false);
  }, [onChange]);

  const canInteract = !!src && !disabled && isEditing;

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
                queueCommit();
              }}
              onZoomChange={(z) => {
                if (!canInteract) return;
                setZoom(clamp(z, 1, maxZoom));
                queueCommit();
              }}
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

        {/* subtle badge when editing */}
        {src && isEditing && !disabled && (
          <div className="pointer-events-none absolute left-2 top-2 rounded-xl bg-black/60 px-2 py-1 text-[10px] text-white">
            Editing (auto-save)
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {src && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                disabled={disabled}
                className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-2 py-1 text-xs text-gray-800 dark:text-gray-200 disabled:opacity-50"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>

              <button
                type="button"
                onClick={() => {
                  // Make sure the latest drag/zoom is committed, then lock.
                  commitNow();
                  setIsEditing(false);
                }}
                disabled={disabled || !isEditing}
                className="inline-flex items-center gap-1 rounded-xl border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-800 disabled:opacity-50 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200"
                title="Lock"
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

      {/* Zoom slider */}
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
              if (!canInteract) return;
              const next = clamp(Number(e.target.value), 1, maxZoom);
              setZoom(next);
              queueCommit();
            }}
            className="w-full"
            disabled={disabled || !isEditing}
          />
        </div>
      )}
    </div>
  );
}
