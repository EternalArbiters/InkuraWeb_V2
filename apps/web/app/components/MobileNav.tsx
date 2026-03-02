"use client";

import NavCountBadge from "./NavCountBadge";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Moon,
  Sun,
  Search,
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
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  userImage: string;
  avatarFocusX?: number;
  avatarFocusY?: number;
  avatarZoom?: number;
  toggleDarkMode: () => void;
  handleLogout: () => void;
  isDarkMode: boolean;
  isAuthed: boolean;
  isAdmin?: boolean;
}

type NavItem = { label: string; href: string; Icon: LucideIcon };

function NavRow({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.Icon;
  const badgeEndpoint = item.href === "/notifications" ? "/api/notifications/unread-count" : item.href === "/admin-report" ? "/api/admin-report/unread-count" : null;
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
      {badgeEndpoint ? (
        <span className="ml-auto">
          <NavCountBadge endpoint={badgeEndpoint} variant="inline" />
        </span>
      ) : null}
    </Link>
  );
}

export default function MobileNav({
  isOpen,
  onClose,
  displayName,
  userImage,
  avatarFocusX = 50,
  avatarFocusY = 50,
  avatarZoom = 1,
  toggleDarkMode,
  handleLogout,
  isDarkMode,
  isAuthed,
  isAdmin,
}: MobileNavProps) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isOpen) return null;

  const navItems: NavItem[] = [
    { label: "Advance Search", href: "/search", Icon: Search },
    { label: "All", href: "/all", Icon: LayoutGrid },
    { label: "Novel", href: "/novel", Icon: BookText },
    { label: "Comic", href: "/comic", Icon: PanelsTopLeft },
    { label: "Film", href: "/film", Icon: Clapperboard },

    { label: "Library", href: "/library", Icon: Bookmark },
    { label: "History", href: "/settings/history", Icon: History },
    { label: "Lists", href: "/lists", Icon: Layers },

    { label: "Notifications", href: "/notifications", Icon: Bell },
    { label: "Upload", href: "/studio", Icon: Upload },
    { label: "Community", href: "/community", Icon: Users },

    { label: "Account", href: "/settings/account", Icon: User },
    // User -> Admin inbox report (for sending a message/report to admin)
    ...(isAuthed ? [{ label: "Admin Report", href: "/admin-report", Icon: ShieldAlert }] : []),
    // Admin-only quick links
    ...(isAdmin ? [{ label: "Content Reports", href: "/admin/reports", Icon: ShieldAlert }] : []),
    ...(isAdmin ? [{ label: "Taxonomy", href: "/admin/taxonomy", Icon: ListTree }] : []),
  ];


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
          {/* User Info */}
          <div className="flex items-center space-x-4 mb-6">
            {isAuthed ? (
              <Link href="/settings/profile" prefetch={false} onClick={onClose} className="flex items-center space-x-4 group">
                <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-400">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={userImage}
                    alt="User"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      objectPosition: `${avatarFocusX}% ${avatarFocusY}%`,
                      transform: `scale(${avatarZoom})`,
                      transformOrigin: "center",
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-800 dark:text-white truncate group-hover:underline">{displayName}</span>
              </Link>
            ) : (
              <>
                <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-400">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={userImage} alt="User" className="absolute inset-0 w-full h-full object-cover" />
                </div>
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
              className="block w-full text-center px-4 py-2 rounded-full text-sm font-semibold bg-red-600 text-white shadow-md hover:bg-red-700 transition"
            >
              Donate For Inkura
            </Link>
          </div>
          {/* Navigation */}
          <nav className="space-y-2">
            {navItems
              .filter((it) => !["Genres", "Regions", "Translated"].includes(it.label))
              .slice(0, 5)
              .map((item) => (
                <NavRow key={item.href} item={item} active={isActive(item.href)} onClick={onClose} />
              ))}

            {/* Categories dropdown (placed right under Film) */}
            <div className="mt-2">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full flex items-center justify-between px-4 py-2 rounded text-sm text-gray-700 dark:text-white/80 hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  <Tags className="w-4 h-4 opacity-90" aria-hidden />
                  Categories
                </span>
                {showDropdown ? (
                  <ChevronUp className="w-4 h-4 opacity-90" aria-hidden />
                ) : (
                  <ChevronDown className="w-4 h-4 opacity-90" aria-hidden />
                )}
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

            {/* Remaining items */}
            {navItems.slice(5).map((item) => (
              <NavRow key={item.href} item={item} active={isActive(item.href)} onClick={onClose} />
            ))}
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
