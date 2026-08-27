"use client";

import * as React from "react";

// v30: samples the cover image's own dominant color client-side (a tiny canvas
// downscale + pixel average — no server/image-processing dependency) and uses
// it as a soft ambient glow behind the top of the work page, so each work's
// header feels tied to its own art instead of a flat neutral panel. Reading
// pixel data off an image loaded from another origin (R2) requires the image
// to be fetched with CORS and the response to allow it — if that's not the
// case, or anything else goes wrong, this silently renders nothing instead of
// crashing, since it's a purely decorative enhancement.
export default function CoverAmbientGlow({ src }: { src: string | null | undefined }) {
  const [color, setColor] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!src) return;
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      try {
        const size = 16;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(img, 0, 0, size, size);
        const { data } = context.getImageData(0, 0, size, size);

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count += 1;
        }
        if (count > 0 && !cancelled) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);
          setColor(`rgb(${r}, ${g}, ${b})`);
        }
      } catch {
        // Tainted canvas (CORS) or anything else — just skip the glow.
      }
    };
    img.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (!color) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] opacity-[0.35] blur-3xl"
      style={{ background: `radial-gradient(ellipse 60% 100% at 50% 0%, ${color}, transparent 75%)` }}
    />
  );
}
