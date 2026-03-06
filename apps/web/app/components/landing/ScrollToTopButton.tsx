"use client";

import { FaArrowUp } from "react-icons/fa";

export default function ScrollToTopButton() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:scale-110 transition-all duration-300"
      aria-label="Scroll to Top"
    >
      <FaArrowUp />
    </button>
  );
}
