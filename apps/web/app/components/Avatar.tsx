"use client";

import Image from "next/image";

function clamp(n: unknown, def: number, min: number, max: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return def;
  return Math.max(min, Math.min(max, v));
}

export default function Avatar({
  src,
  alt,
  focusX,
  focusY,
  zoom,
  className,
}: {
  src: string;
  alt: string;
  focusX?: number | null;
  focusY?: number | null;
  zoom?: number | null;
  className?: string;
}) {
  const fx = clamp(focusX, 50, 0, 100);
  const fy = clamp(focusY, 50, 0, 100);
  const z = clamp(zoom, 1, 1, 2.5);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      style={{
        objectPosition: `${fx}% ${fy}%`,
        transform: `scale(${z})`,
        transformOrigin: "center",
      }}
    />
  );
}
