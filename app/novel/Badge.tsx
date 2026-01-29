"use client";

import { ReactNode } from "react";
import clsx from "clsx";

interface BadgeProps {
  children: ReactNode;
  color?: "pink" | "blue" | "purple" | "green" | "gray" | "custom";
  className?: string;
}

export default function Badge({ children, color = "gray", className }: BadgeProps) {
  const base = "px-2 py-0.5 text-[10px] rounded-full font-medium inline-block";

  const variants = {
    pink: "bg-pink-500 text-white",
    blue: "bg-blue-500 text-white",
    purple: "bg-purple-500 text-white",
    green: "bg-green-500 text-white",
    gray: "bg-gray-300 text-gray-800 dark:bg-white/20 dark:text-white/90",
    custom: "",
  };

  return (
    <span className={clsx(base, variants[color], className)}>
      {children}
    </span>
  );
}
