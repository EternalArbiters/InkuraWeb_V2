"use client";

import * as React from "react";
import EasyCropper, { Area, Point } from "react-easy-crop";
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
  // State internal untuk library react-easy-crop
  const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(value.zoom || 1);
  const [editing, setEditing] = React.useState(true);
  
  // Ref untuk menyimpan hasil kalkulasi terakhir
  const croppedAreaRef = React.useRef<Area | null>(null);

  // Jika src berubah, reset ke mode edit
  React.useEffect(() => {
    if (src) {
      setEditing(true);
      setZoom(value.zoom || 1);
      setCrop({ x: 0, y: 0 }); // Reset offset
    }
  }, [src, value.zoom]);

  const onCropComplete = React.useCallback((_para: Area, croppedAreaPercentages: Area) => {
    croppedAreaRef.current = croppedAreaPercentages;
  }, []);

  const handleApply = () => {
    if (!croppedAreaRef.current) {
      setEditing(false);
      return;
    }

    const area = croppedAreaRef.current;
    // Kalkulasi titik tengah (FocusX/Y) dalam persen
    const focusX = area.x + area.width / 2;
    const focusY = area.y + area.height / 2;

    onChange({
      focusX: Math.round(focusX * 100) / 100,
      focusY: Math.round(focusY * 100) / 100,
      zoom: Math.round(zoom * 100) / 100,
    });

    setEditing(false);
  };

  const handleReset = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    if (!editing) {
      onChange({ focusX: 50, focusY: 50, zoom: 1 });
    }
  };

  const isLocked = !!src && !editing;

  return (
    <div className={className}>
      <div
        className={
          "relative w-full max-w-[420px] rounded-xl border border-gray-200 dark:border-gray-800 bg-black/10 overflow-hidden select-none " +
          (disabled ? "opacity-70 pointer-events-none" : "")
        }
        style={{ aspectRatio: String(aspect) }}
      >
        {src ? (
          editing ? (
            /* MODE EDIT: Menggunakan react-easy-crop */
            <EasyCropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              maxZoom={maxZoom}
              zoomWithScroll={true}
              showGrid={false}
              classes={{
                containerClassName: "bg-black",
                mediaClassName: "max-w-none", // Penting agar tidak konflik dengan CSS global
              }}
            />
          ) : (
            /* MODE LOCKED: Preview stabil dengan CSS object-position */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                objectPosition: `${value.focusX}% ${value.focusY}%`,
                transform: `scale(${value.zoom})`,
                transition: "all 0.2s ease-out", // Smooth transition pas dikunci
              }}
            />
          )
        ) : (
          /* Placeholder jika tidak ada gambar */
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <ImageIcon className="h-10 w-10 opacity-20" />
          </div>
        )}

        {/* Floating Controls */}
        <div className="absolute top-2 right-2 flex gap-2 z-20">
          {onPickImage && (
            <button
              type="button"
              onClick={onPickImage}
              className="h-9 w-9 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 hover:bg-black/80 flex items-center justify-center transition-all"
              title="Ganti Gambar"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          )}

          {src && (
            <button
              type="button"
              onClick={handleReset}
              className="h-9 w-9 rounded-full bg-black/60 text-white backdrop-blur-md border border-white/10 hover:bg-black/80 flex items-center justify-center transition-all"
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          {src && (
            <button
              type="button"
              onClick={() => (editing ? handleApply() : setEditing(true))}
              className="h-9 w-9 rounded-full bg-emerald-500 text-white shadow-lg flex items-center justify-center hover:bg-emerald-600 transition-all"
            >
              {editing ? <Check className="h-5 w-5" /> : <Pencil className="h-4 w-4" />}
            </button>
          )}

          {onRemoveImage && src && (
            <button
              type="button"
              onClick={() => {
                onRemoveImage();
                setEditing(false);
              }}
              className="h-9 w-9 rounded-full bg-red-500/80 text-white flex items-center justify-center hover:bg-red-500 transition-all"
              title="Hapus"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Indikator Zoom (Opsional, muncul saat editing) */}
        {editing && src && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] text-white/80 font-medium z-20 pointer-events-none">
            Zoom: {zoom.toFixed(1)}x
          </div>
        )}
      </div>
    </div>
  );
}