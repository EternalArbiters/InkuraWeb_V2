"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import DashboardNavbar from "./DashboardNavbar";

export default function LayoutClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const showNavbar = pathname !== "/";

  useEffect(() => {
    const dark = localStorage.getItem("theme");
    const isDark = dark === null ? true : dark === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  return (
    <>
      {showNavbar && <DashboardNavbar />}
      {children}
    </>
  );
}
