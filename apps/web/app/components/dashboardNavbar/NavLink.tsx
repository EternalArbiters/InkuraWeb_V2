"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      // Disable prefetch for stability with auth-gated routes.
      // Prefetch can cache an unauthenticated server response (redirect to /auth/signin)
      // which then persists even after the user logs in.
      prefetch={false}
      className={`text-sm font-medium px-3 py-1 rounded transition-all ${
        isActive
          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          : "hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white text-gray-800 dark:text-gray-200"
      }`}
    >
      {children}
    </Link>
  );
}
