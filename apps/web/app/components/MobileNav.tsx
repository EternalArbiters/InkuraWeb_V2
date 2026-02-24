"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Moon,
  Sun,
  Home,
  LayoutGrid,
  BookText,
  PanelsTopLeft,
  Clapperboard,
  Bookmark,
  Bell,
  Upload,
  Users,
  User,
  History,
  Tags,
  Map,
  Languages,
  ShieldAlert,
  ListTree,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  userImage: string;
  toggleDarkMode: () => void;
  handleLogout: () => void;
  isDarkMode: boolean;
  isAuthed: boolean;
  isAdmin?: boolean;
}

type NavItem = { label: string; href: string; Icon: LucideIcon };

function NavRow({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.Icon;
  return (
    <Link
      key={item.href}
      href={item.href}
      prefetch={false}
      onClick={onClick}
      className={
        `flex items-center gap-2 px-4 py-2 rounded text-sm transition ` +
        (active
          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          : "hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white text-gray-700 dark:text-white/80")
      }
    >
      <Icon className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export default function MobileNav({
  isOpen,
  onClose,
  displayName,
  userImage,
  toggleDarkMode,
  handleLogout,
  isDarkMode,
  isAuthed,
  isAdmin,
}: MobileNavProps) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);
  const [brandLogoError, setBrandLogoError] = useState(false);

  if (!isOpen) return null;

  const navItems: NavItem[] = [
    { label: "Home", href: "/home", Icon: Home },
    { label: "All", href: "/all", Icon: LayoutGrid },
    { label: "Novel", href: "/novel", Icon: BookText },
    { label: "Comic", href: "/comic", Icon: PanelsTopLeft },
    { label: "Film", href: "/film", Icon: Clapperboard },
    { label: "Library", href: "/library", Icon: Bookmark },
    { label: "Notifications", href: "/notifications", Icon: Bell },
    { label: "Studio", href: "/studio", Icon: Upload },
    { label: "Community", href: "/community", Icon: Users },
    { label: "Account", href: "/settings/account", Icon: User },
    { label: "History", href: "/settings/history", Icon: History },
  ];

  // Admin-only quick links (keeps user navigation unchanged)
  const adminItems: NavItem[] = isAdmin
    ? [
        { label: "Content Reports", href: "/admin/reports", Icon: ShieldAlert },
        { label: "Taxonomy", href: "/admin/taxonomy", Icon: ListTree },
      ]
    : [];

  const categoryItems: NavItem[] = [
    { label: "Genres", href: "/genre", Icon: Tags },
    { label: "Regions", href: "/region", Icon: Map },
    { label: "Translated", href: "/translated", Icon: Languages },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40" onClick={onClose}>
        <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-br from-purple-700/70 via-indigo-700/60 to-blue-700/50 backdrop-blur-xl" />
      </div>

      {/* Sidebar */}
      <aside className="fixed top-0 right-0 z-50 w-[60%] h-full px-6 py-6 overflow-y-auto transition bg-white dark:bg-gray-900 shadow-xl flex flex-col justify-between">
        <div>
          {/* Brand */}
          <Link href="/home" prefetch={false} onClick={onClose} className="inline-flex items-center gap-2 mb-4">
            {!brandLogoError ? (
              <img src="/logo-inkura.png" alt="Inkura" className="w-5 h-5" onError={() => setBrandLogoError(true)} />
            ) : (
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden />
            )}
            <span className="text-base font-bold text-gray-800 dark:text-white">INKURA</span>
          </Link>

          {/* User Info */}
          <div className="flex items-center space-x-4 mb-6">
            {isAuthed ? (
              <Link href="/settings/profile" prefetch={false} onClick={onClose} className="flex items-center space-x-4 group">
                <Image src={userImage} alt="User" width={36} height={36} className="rounded-full border border-gray-400" />
                <span className="text-sm font-medium text-gray-800 dark:text-white truncate group-hover:underline">{displayName}</span>
              </Link>
            ) : (
              <>
                <Image src={userImage} alt="User" width={36} height={36} className="rounded-full border border-gray-400" />
                <span className="text-sm font-medium text-gray-800 dark:text-white truncate">{displayName}</span>
              </>
            )}
          </div>

          {/* Chat CTA */}
          <div className="mb-6">
            <Link
              href="/chat"
              prefetch={false}
              onClick={onClose}
              className="block w-full text-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:brightness-110 transition transform hover:scale-105"
            >
              Chat Elya~
            </Link>
          </div>



          {/* Donate CTA */}
          <div className="mb-6">
            <Link
              href="/donate"
              prefetch={false}
              onClick={onClose}
              className="block w-full text-center px-4 py-2 rounded-full text-sm font-semibold border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white/90 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              Donate For Inkura
            </Link>
          </div>
          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavRow key={item.href} item={item} active={isActive(item.href)} onClick={onClose} />
            ))}

            {adminItems.length ? (
              <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-800">
                {adminItems.map((item) => (
                  <NavRow key={item.href} item={item} active={isActive(item.href)} onClick={onClose} />
                ))}
              </div>
            ) : null}

            {/* Dropdown */}
            <div className="mt-2">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full flex items-center justify-between px-4 py-2 rounded text-sm text-gray-700 dark:text-white/80 hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Tags className="w-4 h-4 opacity-90" aria-hidden />
                  Categories
                </span>
                {showDropdown ? <ChevronUp className="w-4 h-4 opacity-90" aria-hidden /> : <ChevronDown className="w-4 h-4 opacity-90" aria-hidden />}
              </button>
              {showDropdown && (
                <div className="ml-4 mt-1 space-y-1">
                  {categoryItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      prefetch={false}
                      onClick={onClose}
                      className={
                        `flex items-center gap-2 px-3 py-1 rounded text-sm transition ` +
                        (isActive(item.href)
                          ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                          : "hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white text-gray-600 dark:text-white/70")
                      }
                    >
                      <item.Icon className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Footer: Theme + Auth */}
        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-white">Theme</span>
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle Theme"
              className={
                `w-14 h-8 rounded-full flex items-center px-1 transition shadow-inner ` +
                (isDarkMode ? "bg-gradient-to-r from-blue-600 to-purple-600 justify-end" : "bg-gray-300 justify-start")
              }
            >
              <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                {isDarkMode ? <Moon size={14} className="text-indigo-700" /> : <Sun size={14} className="text-yellow-600" />}
              </div>
            </button>
          </div>

          {isAuthed ? (
            <button onClick={handleLogout} className="w-full text-left px-4 py-2 rounded text-red-500 hover:bg-white/10">
              Logout
            </button>
          ) : (
            <Link
              href="/auth/signin"
              prefetch={false}
              onClick={onClose}
              className="block w-full text-left px-4 py-2 rounded text-purple-600 dark:text-purple-400 font-semibold hover:bg-white/10"
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
