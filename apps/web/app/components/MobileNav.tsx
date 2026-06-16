"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import NavCountBadge from "@/app/components/NavCountBadge";
import {
  Search, LayoutGrid, BookText, PanelsTopLeft, Clapperboard,
  Bookmark, Bell, Upload, Users, User, History, Tags, Map, Languages,
  ShieldAlert, ListTree, BarChart3, Gift, Layers,
  ChevronDown, ChevronUp, Trophy, Award, Sun, Moon, Wallet,
  BookOpen, Settings, MessageCircle, ArrowLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import { useUITheme } from "@/app/components/ui-theme/UIThemeProvider";

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
type ActiveTab = "book" | "settings";

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
  const t = useUILanguageText("Navigation");
  const tCommunity = useUILanguageText("Navigation Community");
  const { uiTheme } = useUITheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>("book");
  const [showCategories, setShowCategories] = useState(false);
  const [showCategoriesClassic, setShowCategoriesClassic] = useState(false);

  if (!isOpen) return null;

  const isActive = (href: string) => pathname === href;

  /* ── shared nav data ── */
  const bookTop: NavItem[] = [
    { label: t("Advanced Search"), href: "/search", Icon: Search },
    { label: t("All"), href: "/all", Icon: LayoutGrid },
    { label: t("Novel"), href: "/novel", Icon: BookText },
    { label: t("Comic"), href: "/comic", Icon: PanelsTopLeft },
    { label: t("Film"), href: "/film", Icon: Clapperboard },
  ];
  const categoryItems: NavItem[] = [
    { label: t("Genres"), href: "/genre", Icon: Tags },
    { label: t("Regions"), href: "/region", Icon: Map },
    { label: t("Translated"), href: "/translated", Icon: Languages },
  ];
  const bookBottom: NavItem[] = [
    { label: t("Library"), href: "/library", Icon: Bookmark },
    { label: t("History"), href: "/settings/history", Icon: History },
    { label: t("Collection"), href: "/lists", Icon: Layers },
  ];

  /* ── Classic mode (original design) ── */
  if (uiTheme !== "modern") {
    const allNavItems: NavItem[] = [
      ...bookTop,
      { label: t("Library"), href: "/library", Icon: Bookmark },
      { label: t("History"), href: "/settings/history", Icon: History },
      { label: t("Collection"), href: "/lists", Icon: Layers },
      { label: t("Notifications"), href: "/notifications", Icon: Bell },
      { label: t("Upload"), href: "/studio", Icon: Upload },
      { label: t("Community"), href: "/community", Icon: Users },
      { label: tCommunity("Ranking"), href: "/community/ranking", Icon: Trophy },
      { label: tCommunity("Title"), href: "/community/title", Icon: Award },
      { label: t("Account"), href: "/settings/account", Icon: User },
      ...(isAuthed ? [{ label: t("Finances"), href: "/settings/payout", Icon: Wallet }] : []),
      ...(isAuthed ? [{ label: t("Admin Report"), href: "/admin-report", Icon: ShieldAlert }] : []),
      ...(isAdmin ? [{ label: t("Content Reports"), href: "/admin/reports", Icon: ShieldAlert }] : []),
      ...(isAdmin ? [{ label: t("Taxonomy"), href: "/admin/taxonomy", Icon: ListTree }] : []),
      ...(isAdmin ? [{ label: t("Creator Donations"), href: "/admin/donations", Icon: Gift }] : []),
      ...(isAdmin ? [{ label: t("Analytics"), href: "/admin/analytics", Icon: BarChart3 }] : []),
    ];

    const classicRow = (item: NavItem, badge?: string) => (
      <Link
        key={item.href}
        href={item.href}
        prefetch={false}
        onClick={onClose}
        className={`flex items-center gap-2 rounded px-4 py-2 text-sm transition ${
          isActive(item.href)
            ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white dark:text-white/80"
        }`}
      >
        <item.Icon className="h-4 w-4 shrink-0 opacity-90" />
        <span className="truncate">{item.label}</span>
        {badge && (
          <span className="ml-auto">
            <NavCountBadge endpoint={badge} variant="inline" enabled={isAuthed} />
          </span>
        )}
      </Link>
    );

    return (
      <>
        <div className="fixed inset-0 z-40" onClick={onClose}>
          <div className="absolute right-0 top-0 h-full w-[60%] bg-gradient-to-br from-purple-700/70 via-indigo-700/60 to-blue-700/50 backdrop-blur-xl" />
        </div>
        <aside className="fixed right-0 top-0 z-50 flex h-full w-[60%] flex-col justify-between overflow-y-auto bg-white px-6 py-6 shadow-xl dark:bg-gray-900">
          <div>
            <div className="mb-6 flex items-center space-x-4">
              {isAuthed ? (
                <Link href="/profile" prefetch={false} onClick={onClose} className="group flex items-center space-x-4">
                  <div className="relative h-9 w-9 overflow-hidden rounded-full border border-gray-400">
                    <img src={userImage} alt={t("User")} className="absolute inset-0 h-full w-full object-cover"
                      style={{ objectPosition: `${avatarFocusX}% ${avatarFocusY}%`, transform: `scale(${avatarZoom})`, transformOrigin: "center" }} />
                  </div>
                  <span className="truncate text-sm font-medium text-gray-800 group-hover:underline dark:text-white">{displayName}</span>
                </Link>
              ) : (
                <>
                  <div className="relative h-9 w-9 overflow-hidden rounded-full border border-gray-400">
                    <img src={userImage} alt={t("User")} className="absolute inset-0 h-full w-full object-cover" />
                  </div>
                  <span className="truncate text-sm font-medium text-gray-800 dark:text-white">{displayName}</span>
                </>
              )}
            </div>
            <div className="mb-6">
              <Link href="/chat" prefetch={false} onClick={onClose}
                className="block w-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-md transition hover:brightness-110 hover:scale-105">
                {t("Chat Elya~")}
              </Link>
            </div>
            <div className="mb-6">
              <Link href="/donate" prefetch={false} onClick={onClose}
                className="block w-full rounded-full bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white shadow-md transition hover:bg-red-700">
                {t("Donate For Inkura")}
              </Link>
            </div>
            <nav className="space-y-2">
              {allNavItems.slice(0, 5).map((item) => classicRow(item,
                item.href === "/notifications" ? "/api/notifications/unread-count"
                : item.href === "/admin-report" ? "/api/admin-report/unread-count"
                : undefined))}
              <div className="mt-2">
                <button onClick={() => setShowCategoriesClassic((v) => !v)}
                  className="flex w-full items-center justify-between rounded px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white dark:text-white/80">
                  <span className="inline-flex items-center gap-2">
                    <Tags className="h-4 w-4 opacity-90" />{t("Categories")}
                  </span>
                  {showCategoriesClassic ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showCategoriesClassic && (
                  <div className="ml-4 mt-1 space-y-1">
                    {categoryItems.map((item) => (
                      <Link key={item.href} href={item.href} prefetch={false} onClick={onClose}
                        className={`flex items-center gap-2 rounded px-3 py-1 text-sm transition ${
                          isActive(item.href) ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                          : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white dark:text-white/70"}`}>
                        <item.Icon className="h-4 w-4 shrink-0 opacity-90" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              {allNavItems.slice(5).map((item) => classicRow(item,
                item.href === "/notifications" ? "/api/notifications/unread-count"
                : item.href === "/admin-report" ? "/api/admin-report/unread-count"
                : undefined))}
            </nav>
          </div>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-white">{t("Theme")}</span>
              <button onClick={toggleDarkMode}
                className={`flex h-8 w-14 items-center rounded-full px-1 shadow-inner transition ${isDarkMode ? "justify-end bg-gradient-to-r from-blue-600 to-purple-600" : "justify-start bg-gray-300"}`}>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md">
                  {isDarkMode ? <Moon size={14} className="text-indigo-700" /> : <Sun size={14} className="text-yellow-600" />}
                </div>
              </button>
            </div>
            {isAuthed ? (
              <button onClick={handleLogout} className="w-full rounded px-4 py-2 text-left text-red-500 hover:bg-white/10">
                {t("Logout")}
              </button>
            ) : (
              <Link href="/auth/signin" prefetch={false} onClick={onClose}
                className="block w-full rounded px-4 py-2 text-left font-semibold text-purple-600 hover:bg-white/10 dark:text-purple-400">
                {t("Sign In")}
              </Link>
            )}
          </div>
        </aside>
      </>
    );
  }

  /* ── Modern mode continues below ── */

  const settingsItems: NavItem[] = [
    { label: t("Notifications"), href: "/notifications", Icon: Bell },
    { label: t("Upload"), href: "/studio", Icon: Upload },
    { label: t("Community"), href: "/community", Icon: Users },
    { label: tCommunity("Ranking"), href: "/community/ranking", Icon: Trophy },
    { label: tCommunity("Title"), href: "/community/title", Icon: Award },
    { label: t("Account"), href: "/settings/account", Icon: User },
    ...(isAuthed ? [{ label: t("Finances"), href: "/settings/payout", Icon: Wallet }] : []),
    ...(isAuthed ? [{ label: t("Admin Report"), href: "/admin-report", Icon: ShieldAlert }] : []),
    ...(isAdmin ? [{ label: t("Content Reports"), href: "/admin/reports", Icon: ShieldAlert }] : []),
    ...(isAdmin ? [{ label: t("Taxonomy"), href: "/admin/taxonomy", Icon: ListTree }] : []),
    ...(isAdmin ? [{ label: t("Creator Donations"), href: "/admin/donations", Icon: Gift }] : []),
    ...(isAdmin ? [{ label: t("Analytics"), href: "/admin/analytics", Icon: BarChart3 }] : []),
  ];

  const NavLink = ({ item, badge }: { item: NavItem; badge?: string }) => {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        prefetch={false}
        onClick={onClose}
        className={`flex items-center gap-2 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors ${
          active
            ? "bg-white/12 font-semibold text-white"
            : "text-white/55 hover:bg-white/8 hover:text-white/85"
        }`}
      >
        <item.Icon size={13} className="shrink-0" />
        <span className="truncate">{item.label}</span>
        {active && (
          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
        )}
        {badge && (
          <span className="ml-auto">
            <NavCountBadge endpoint={badge} variant="inline" enabled={!!isAuthed} />
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ══════════ SIDEBAR ══════════ */}
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-[78%] max-w-[320px] flex-col overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(150deg,#0c0e1b 0%,#111827 100%)" }}
      >

        {/* ▓▓ [1] DONATE — full width, always top ▓▓ */}
        <div className="shrink-0 px-4 pt-5 pb-3">
          <Link
            href="/donate"
            prefetch={false}
            onClick={onClose}
            className="block w-full rounded-full bg-gradient-to-r from-rose-500 to-red-600 py-2.5 text-center text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            {t("Donate For Inkura")}
          </Link>
        </div>

        <div className="mx-4 h-px shrink-0 bg-white/[0.08]" />

        {/* ▓▓ [2] MAIN AREA — 2 columns ▓▓ */}
        <div className="flex min-h-0 flex-1">

          {/* ░░ KOLOM KIRI: foto profil (besar) + 3 tombol horizontal ░░ */}
          <div
            className="flex shrink-0 flex-col items-center border-r border-white/[0.08] py-6"
            style={{ width: "42%" }}
          >
            {/* Foto profil — besar */}
            {isAuthed ? (
              <Link href="/profile" prefetch={false} onClick={onClose} className="group">
                <div
                  className="overflow-hidden rounded-full transition group-hover:scale-[1.03]"
                  style={{
                    width: 82,
                    height: 82,
                    boxShadow: "0 0 0 3px rgba(139,92,246,0.55), 0 0 0 5px rgba(59,130,246,0.18)",
                  }}
                >
                  <img
                    src={userImage}
                    alt={displayName}
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: `${avatarFocusX}% ${avatarFocusY}%`,
                      transform: `scale(${avatarZoom})`,
                      transformOrigin: "center",
                    }}
                  />
                </div>
              </Link>
            ) : (
              <div
                className="overflow-hidden rounded-full"
                style={{
                  width: 82,
                  height: 82,
                  boxShadow: "0 0 0 3px rgba(255,255,255,0.15)",
                }}
              >
                <img src={userImage} alt="" className="h-full w-full object-cover" />
              </div>
            )}

            {/* Jarak antara foto dan tombol */}
            <div style={{ height: 20 }} />

            {/* 3 tombol HORIZONTAL: Book | Settings | Chat */}
            <div className="flex items-center gap-2.5">

              {/* Book */}
              <button
                type="button"
                onClick={() => setActiveTab("book")}
                aria-label="Browse"
                className="flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: 36,
                  height: 36,
                  background:
                    activeTab === "book"
                      ? "linear-gradient(135deg,#3b82f6,#9333ea)"
                      : "rgba(255,255,255,0.08)",
                  color: activeTab === "book" ? "#fff" : "rgba(255,255,255,0.4)",
                  boxShadow:
                    activeTab === "book"
                      ? "0 4px 14px rgba(147,51,234,0.4)"
                      : "none",
                }}
              >
                <BookOpen size={16} />
              </button>

              {/* Settings */}
              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                aria-label="Settings"
                className="flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: 36,
                  height: 36,
                  background:
                    activeTab === "settings"
                      ? "linear-gradient(135deg,#3b82f6,#9333ea)"
                      : "rgba(255,255,255,0.08)",
                  color: activeTab === "settings" ? "#fff" : "rgba(255,255,255,0.4)",
                  boxShadow:
                    activeTab === "settings"
                      ? "0 4px 14px rgba(147,51,234,0.4)"
                      : "none",
                }}
              >
                <Settings size={16} />
              </button>

              {/* Chat — langsung navigate */}
              <Link
                href="/chat"
                prefetch={false}
                onClick={onClose}
                aria-label="Chat Elya"
                className="flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: 36,
                  height: 36,
                  background: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                <MessageCircle size={16} />
              </Link>
            </div>
          </div>

          {/* ░░ KOLOM KANAN: username atas + nav items ░░ */}
          <div className="flex min-h-0 flex-1 flex-col">

            {/* Username / Display name — sejajar dengan foto profil */}
            <div className="shrink-0 px-3 py-6">
              {isAuthed ? (
                <Link href="/profile" prefetch={false} onClick={onClose} className="group block">
                  <p className="truncate text-[13px] font-bold leading-tight text-white transition group-hover:text-white/80">
                    {displayName}
                  </p>
                  <p className="mt-1 text-[11px] text-white/35">View profile →</p>
                </Link>
              ) : (
                <p className="truncate text-[13px] font-bold text-white/80">{displayName}</p>
              )}
            </div>

            <div className="mx-3 h-px shrink-0 bg-white/[0.08]" />

            {/* Nav items — scrollable, mengisi sisa tinggi */}
            <div className="flex-1 overflow-y-auto py-1.5 pr-1.5 pl-1">

              {activeTab === "book" ? (
                <nav className="space-y-0.5">
                  {bookTop.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}

                  {/* Categories expandable */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowCategories((v) => !v)}
                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-[7px] text-[13px] text-white/55 transition-colors hover:bg-white/8 hover:text-white/85"
                    >
                      <span className="flex items-center gap-2">
                        <Tags size={13} className="shrink-0" />
                        {t("Categories")}
                      </span>
                      {showCategories ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                    {showCategories && (
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/[0.08] pl-2">
                        {categoryItems.map((item) => (
                          <NavLink key={item.href} item={item} />
                        ))}
                      </div>
                    )}
                  </div>

                  {bookBottom.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                </nav>
              ) : (
                <nav className="space-y-0.5">
                  {settingsItems.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      badge={
                        item.href === "/notifications"
                          ? "/api/notifications/unread-count"
                          : item.href === "/admin-report"
                            ? "/api/admin-report/unread-count"
                            : undefined
                      }
                    />
                  ))}

                  {/* Theme toggle */}
                  <div className="mt-2 border-t border-white/[0.08] pt-2">
                    <div className="flex items-center justify-between rounded-lg px-2.5 py-[7px]">
                      <span className="text-[13px] text-white/55">{t("Theme")}</span>
                      <button
                        onClick={toggleDarkMode}
                        className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-all ${
                          isDarkMode
                            ? "justify-end bg-gradient-to-r from-blue-600 to-purple-600"
                            : "justify-start bg-white/20"
                        }`}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
                          {isDarkMode
                            ? <Moon size={10} className="text-indigo-700" />
                            : <Sun size={10} className="text-yellow-600" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {isAuthed ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-lg px-2.5 py-[7px] text-left text-[13px] text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                    >
                      {t("Logout")}
                    </button>
                  ) : (
                    <Link
                      href="/auth/signin"
                      prefetch={false}
                      onClick={onClose}
                      className="block rounded-lg px-2.5 py-[7px] text-[13px] font-semibold text-purple-400 transition hover:bg-purple-500/10"
                    >
                      {t("Sign In")}
                    </Link>
                  )}
                </nav>
              )}
            </div>
          </div>
        </div>

        {/* ▓▓ [3] BACK — full width, always bottom ▓▓ */}
        <div className="shrink-0 border-t border-white/[0.08] px-4 pb-6 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] py-2.5 text-[13px] text-white/40 transition hover:border-white/25 hover:text-white/65"
          >
            <ArrowLeft size={14} />
            <span>{t("Back")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
