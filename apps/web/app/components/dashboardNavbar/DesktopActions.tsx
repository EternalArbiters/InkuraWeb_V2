"use client";

import Link from "next/link";
import {
  Upload,
  Settings,
  LogOut,
  Users,
  History,
  ListOrdered,
  Bookmark,
  Layers,
  Bell,
  Sun,
  Moon,
} from "lucide-react";
import IconButton from "../IconButton";
import NavCountBadge from "../NavCountBadge";
import { CATEGORY_PATHS } from "./constants";

function compactDisplayName(value: string) {
  const firstWord = String(value || "").trim().split(/\s+/).filter(Boolean)[0] || "User";
  return firstWord.length > 12 ? `${firstWord.slice(0, 12)}...` : firstWord;
}

export default function DesktopActions({
  dropdown,
  toggleDropdown,
  isAuthed,
  userRole,
  displayName,
  userImage,
  avatarFocusX,
  avatarFocusY,
  avatarZoom,
  isDarkMode,
  toggleDarkMode,
  handleLogout,
}: {
  dropdown: string;
  toggleDropdown: (id: string) => void;
  isAuthed: boolean;
  userRole?: string;
  displayName: string;
  userImage: string;
  avatarFocusX: number;
  avatarFocusY: number;
  avatarZoom: number;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  handleLogout: () => void;
}) {
  return (
    <div className="flex items-center gap-0 pl-6 h-10">
      <IconButton icon={<Upload size={22} />} label="Upload" href="/studio" />
      <div className="relative">
        <IconButton
          icon={<ListOrdered size={22} />}
          label="Category"
          onClick={() => toggleDropdown("category")}
        />
        {dropdown === "category" && (
          <div className="absolute mt-2 right-0 z-50 bg-white dark:bg-gray-800 border rounded shadow-lg">
            {CATEGORY_PATHS.map((path) => (
              <Link
                key={path}
                href={`/${path}`}
                className="block px-4 py-2 hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white"
              >
                {path[0].toUpperCase() + path.slice(1)}
              </Link>
            ))}
          </div>
        )}
      </div>
      <IconButton icon={<Users size={22} />} label="Community" href="/community" />
      <div className="relative">
        <IconButton
          icon={
            <div className="relative">
              <Bell size={22} />
              <NavCountBadge endpoint="/api/notifications/unread-count" />
            </div>
          }
          label="Notifications"
          href="/notifications"
        />
      </div>
      <IconButton icon={<Bookmark size={22} />} label="Library" href="/library" />
      <IconButton icon={<Layers size={22} />} label="Lists" href="/lists" />
      <IconButton icon={<History size={22} />} label="History" href="/settings/history" />
      <div className="relative">
        <IconButton
          icon={<Settings size={22} />}
          label="Settings"
          onClick={() => toggleDropdown("settings")}
        />
        {dropdown === "settings" && (
          <div className="absolute mt-2 right-0 z-50 bg-white dark:bg-gray-800 border rounded shadow-lg w-48">
            {isAuthed ? (
              <Link
                href="/profile"
                prefetch={false}
                className="block px-4 py-2 hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white"
              >
                Profile
              </Link>
            ) : null}
            <Link
              href="/settings/account"
              className="block px-4 py-2 hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white"
            >
              Account
            </Link>
            {isAuthed ? (
              <Link
                href="/admin-report"
                className="block px-4 py-2 hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white"
              >
                <span className="inline-flex items-center gap-2">
                  Admin Report
                  <NavCountBadge
                    endpoint="/api/admin-report/unread-count"
                    variant="inline"
                  />
                </span>
              </Link>
            ) : null}
            {userRole === "ADMIN" ? (
              <Link
                href="/admin/reports"
                className="block px-4 py-2 hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white"
              >
                Content Reports
              </Link>
            ) : null}
            {userRole === "ADMIN" ? (
              <Link
                href="/admin/taxonomy"
                className="block px-4 py-2 hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white"
              >
                Taxonomy
              </Link>
            ) : null}
            <div className="px-4 py-2">
              <button
                onClick={toggleDarkMode}
                className={`w-14 h-8 rounded-full flex items-center px-1 shadow-inner ${
                  isDarkMode
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 justify-end"
                    : "bg-gray-300 justify-start"
                }`}
              >
                <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                  {isDarkMode ? (
                    <Moon size={14} className="text-indigo-700" />
                  ) : (
                    <Sun size={14} className="text-yellow-600" />
                  )}
                </div>
              </button>
            </div>
            <div className="px-4 pb-2">
              <Link
                href="/donate"
                prefetch={false}
                className="block w-full text-center px-3 py-2 rounded-full text-sm font-semibold bg-red-600 text-white shadow-md hover:bg-red-700 transition"
              >
                Donate For Inkura
              </Link>
            </div>
            {isAuthed ? (
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <LogOut size={16} /> Logout
              </button>
            ) : (
              <Link
                href="/auth/signin"
                className="block px-4 py-2 hover:bg-gradient-to-r from-blue-500 to-purple-600 hover:text-white"
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Profile Info (Desktop Only) */}
      {isAuthed ? (
        <Link
          href="/profile"
          prefetch={false}
          className="ml-4 hidden md:flex items-center gap-2 group min-w-0 max-w-[150px]"
        >
          <span className="max-w-[102px] truncate text-sm font-medium text-gray-800 dark:text-white group-hover:underline">
            {compactDisplayName(displayName)}
          </span>
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={userImage}
              alt="pp"
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                objectPosition: `${avatarFocusX}% ${avatarFocusY}%`,
                transform: `scale(${avatarZoom})`,
                transformOrigin: "center",
              }}
            />
          </div>
        </Link>
      ) : (
        <div className="ml-4 hidden md:flex items-center gap-2 min-w-0 max-w-[150px]">
          <span className="max-w-[102px] truncate text-sm font-medium text-gray-800 dark:text-white">
            {compactDisplayName(displayName)}
          </span>
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={userImage}
              alt="pp"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
