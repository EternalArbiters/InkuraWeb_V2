"use client";

import { useEffect, useState } from "react";

export function useMobileHeaderVisibility({
  isMenuOpen,
  setIsMenuOpen,
}: {
  isMenuOpen: boolean;
  setIsMenuOpen: (next: boolean) => void;
}) {
  const [showMobileNav, setShowMobileNav] = useState(true);
  const [scrollY, setScrollY] = useState(0);

  // Hide scroll button if menu open
  useEffect(() => {
    const scrollBtn = document.getElementById("scrollToTop");
    if (scrollBtn) {
      scrollBtn.style.display = isMenuOpen ? "none" : "block";
    }
  }, [isMenuOpen]);

  // Hide navbar on scroll down (only mobile)
  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const current = window.scrollY;
      setScrollY(current);
      if (current <= 10) {
        setShowMobileNav(true);
      } else if (current > lastY) {
        setShowMobileNav(false);
      } else {
        setShowMobileNav(true);
      }
      lastY = current;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleTap = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const clickedInsideSidebar = target.closest("aside");
      const clickedInsideHeader = target.closest("header");

      // If the click happens inside the sidebar or header, do not close it
      if (clickedInsideSidebar || clickedInsideHeader) return;

      // If the click happens outside the sidebar and header
      if (isMenuOpen && !showMobileNav) {
        setIsMenuOpen(false);
        setShowMobileNav(true);
      } else if (isMenuOpen) {
        setIsMenuOpen(false);
      } else if (!isMenuOpen && !showMobileNav && scrollY > 20) {
        setShowMobileNav(true);
      } else if (!isMenuOpen && showMobileNav && scrollY > 20) {
        setShowMobileNav(false);
      }
    };

    document.addEventListener("click", handleTap);
    return () => document.removeEventListener("click", handleTap);
  }, [isMenuOpen, showMobileNav, scrollY, setIsMenuOpen]);

  return { showMobileNav, setShowMobileNav, scrollY };
}
