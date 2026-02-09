"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  userImage: string;
  toggleDarkMode: () => void;
  handleLogout: () => void;
  isDarkMode: boolean;
  isAuthed: boolean;
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
}: MobileNavProps) {
  const pathname = usePathname();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!isOpen) return null;

  const navItems = [
    ["Home", "/home"],
    ["All", "/all"],
    ["Novel", "/novel"],
    ["Comic", "/comic"],
    ["Film", "/film"],
    ["Library", "/library"],
    ["Notifications", "/notifications"],
    ["Studio", "/studio"],
    ["Community", "/community"],
    ["Account", "/settings/account"],
    ["History", "/settings/history"],
  ];

  const categoryItems = [
    ["Genres", "/genre"],
    ["Regions", "/region"],
    ["Translated", "/translated"],
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
            <Image src={userImage} alt="User" width={36} height={36} className="rounded-full border border-gray-400" />
            <span className="text-sm font-medium text-gray-800 dark:text-white truncate">{displayName}</span>
          </div>

          
          <div className="mb-6">
            <Link
              href="/chat"
              onClick={onClose}
              className="block w-full text-center px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-md hover:brightness-110 transition transform hover:scale-105"
            >
              Chat Elya~
            </Link>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map(([label, href]) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`block px-4 py-2 rounded text-sm transition ${isActive(href)
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                  : "hover:bg-gradient-to-r from-pink-500 to-purple-500 hover:text-white text-gray-700 dark:text-white/80"
                  }`}
              >
                {label}
              </Link>
            ))}

            {/* Dropdown */}
            <div className="mt-2">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full text-left px-4 py-2 rounded text-sm text-gray-700 dark:text-white/80 hover:bg-gradient-to-r from-pink-500 to-purple-500 hover:text-white"
              >
                Categories
              </button>
              {showDropdown && (
                <div className="ml-4 mt-1 space-y-1">
                  {categoryItems.map(([label, href]) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={onClose}
                      className={`block px-3 py-1 rounded text-sm transition ${isActive(href)
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                        : "hover:bg-gradient-to-r from-pink-500 to-purple-500 hover:text-white text-gray-600 dark:text-white/70"
                        }`}
                    >
                      {label}
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
              className={`w-14 h-8 rounded-full flex items-center px-1 transition shadow-inner ${isDarkMode
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 justify-end"
                : "bg-gray-300 justify-start"
                }`}
            >
              <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                {isDarkMode ? "" : ""}
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
