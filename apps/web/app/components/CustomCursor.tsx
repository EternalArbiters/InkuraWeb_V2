"use client";
import { useEffect, useState, useRef } from "react";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false); // Tambahkan state
  const cursorRef = useRef<HTMLDivElement>(null);

  // Deteksi perangkat mobile (pointer: coarse)
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsMobile(true);
    }
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    document.body.style.cursor = "none"; // Sembunyikan kursor asli

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.style.cursor = "";
    };
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;

    const trailContainer = document.createElement("div");
    document.body.appendChild(trailContainer);

    const createTrail = () => {
      const trail = document.createElement("div");
      trail.style.position = "fixed";
      trail.style.left = position.x + "px";
      trail.style.top = position.y + "px";
      trail.style.width = "6px";
      trail.style.height = "6px";
      trail.style.borderRadius = "50%";
      trail.style.background = "radial-gradient(circle, #FFD700, #FF69B4)";
      trail.style.pointerEvents = "none";
      trail.style.zIndex = "9998";
      trail.style.opacity = "0.5";
      trail.style.boxShadow = "0 0 6px #FFC0CB";
      trail.style.transition = "opacity 0.4s ease-out, transform 0.4s ease-out";
      trail.style.transform = "scale(1)";

      trailContainer.appendChild(trail);

      requestAnimationFrame(() => {
        trail.style.opacity = "0";
        trail.style.transform = "scale(0.3)";
      });

      setTimeout(() => {
        trail.remove();
      }, 400);
    };

    const trailInterval = setInterval(createTrail, 25);

    return () => {
      clearInterval(trailInterval);
      trailContainer.remove();
    };
  }, [position, isMobile]);

  if (isMobile) return null;

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed top-0 left-0 z-[9999]"
      style={{
        transform: `translate(${position.x}px, ${position.y}px) translate(-50%, -50%)`,
        transition: "transform 0.04s linear",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #FFD700, #FF69B4)",
          boxShadow: `
            0 0 10px rgba(255, 214, 165, 0.8),
            0 0 20px rgba(255, 105, 180, 0.6),
            0 0 40px rgba(255, 105, 180, 0.4)
          `,
          animation: "pulse-glow 2s ease-in-out infinite",
        }}
      />
    </div>
  );
}
