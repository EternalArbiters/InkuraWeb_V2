"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

const STORAGE_KEY = "inkura_welcome_v1";
const TOTAL_SLIDES = 2;

export default function WelcomePopup() {
  const t = useUILanguageText("Welcome Popup");
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  function close() {
    setVisible(false);
  }

  function neverShow() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function next() {
    setSlide((s) => Math.min(s + 1, TOTAL_SLIDES - 1));
  }

  function prev() {
    setSlide((s) => Math.max(s - 1, 0));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) next();
    else if (diff < -50) prev();
    touchStartX.current = null;
  }

  const slideTexts = [
    t("Welcome to Inkura! Just so you know, you're in a safe zone! Don't worry, everything here is safe to read! It's best not to open the door to the forbidden zone, okay ^^"),
    t("Hello, creators on Inkura! Feel free to upload whatever you like. But please follow the rules! If you're a translator, mark your work as a translation. Original works are for authors and direct creators only! Don't mix them up. Same goes for re-uploaders!"),
  ];

  const isLastSlide = slide === TOTAL_SLIDES - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close button */}
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 text-lg leading-none"
        >
          ×
        </button>

        {/* Character image */}
        <div className="flex justify-center pt-7 pb-1">
          <Image
            src="/images/Kucchan.png"
            alt={t("Inkura Mascot")}
            width={110}
            height={110}
            className="object-contain drop-shadow-md"
          />
        </div>

        {/* Slide text */}
        <div className="px-6 pt-3 pb-2 min-h-[100px] flex items-center justify-center">
          <p className="text-center text-sm leading-relaxed text-gray-800 dark:text-gray-100">
            {slideTexts[slide]}
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 py-3">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === slide
                  ? "bg-purple-500"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-4 gap-3">
          <button
            onClick={prev}
            disabled={slide === 0}
            className="px-4 py-2 text-sm rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 disabled:opacity-30 transition"
          >
            {t("Previous")}
          </button>
          {isLastSlide ? (
            <button
              onClick={neverShow}
              className="px-4 py-2 text-sm rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              {t("Don't show again")}
            </button>
          ) : (
            <button
              onClick={next}
              className="px-4 py-2 text-sm rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              {t("Next")}
            </button>
          )}
        </div>

        {/* Don't show again link (always visible) */}
        <div className="text-center pb-5">
          <button
            onClick={neverShow}
            className="text-xs text-gray-400 dark:text-gray-500 hover:underline"
          >
            {t("Don't show again")}
          </button>
        </div>
      </div>
    </div>
  );
}
