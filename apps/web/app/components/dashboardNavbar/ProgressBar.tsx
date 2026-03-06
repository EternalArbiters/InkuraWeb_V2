"use client";

export default function ProgressBar({
  isMenuOpen,
  isNavigating,
  navProgress,
}: {
  isMenuOpen: boolean;
  isNavigating: boolean;
  navProgress: number;
}) {
  if (isMenuOpen) return null;

  return (
    <div className="relative h-1 w-full">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-25" />
      <div
        className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 origin-left transition-opacity duration-200 shadow-[0_0_12px_rgba(59,130,246,0.25)]"
        style={{
          transform: `scaleX(${Math.max(0.06, navProgress / 100)})`,
          opacity: isNavigating ? 1 : 0,
        }}
      />
    </div>
  );
}
