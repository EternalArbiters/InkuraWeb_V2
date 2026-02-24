"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import DashboardNavbar from "./DashboardNavbar";
import FloatingActions from "./FloatingActions";

export default function LayoutClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const showNavbar = pathname !== "/" && !pathname.startsWith("/auth");

  useEffect(() => {
    const dark = localStorage.getItem("theme");
    const isDark = dark === null ? true : dark === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  return (
    <>
      {showNavbar && <DashboardNavbar />}

      {/* Floating quick actions (scroll-top, chat) */}
      {showNavbar && <FloatingActions />}

      {/* Offset page content from the fixed navbar */}
      <div
        className={
          showNavbar
            ? "pt-24 min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white"
            : ""
        }
      >
        {children}
      </div>
    </>
  );
}
