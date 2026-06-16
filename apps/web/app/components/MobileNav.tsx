"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import NavCountBadge from "@/app/components/NavCountBadge";
import {
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
  BarChart3,
  Gift,
  Layers,
  ChevronDown,
  ChevronUp,
  Trophy,
  Award,
  Sun,
  Moon,
  Wallet,
  BookOpen,
  Settings,
  MessageCircle,
  ArrowLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

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

function NavLink({
  item,
  active,
  onClick,
  badge,
  isAuthed,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  badge?: string;
  isAuthed?: boolean;
}) {
  const cls = active
    ? "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-white"
    : "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors";

  return (
    <Link href={item.href} prefetch={false} onClick={onClick} className={cls}>
      <item.Icon size={15} className="shrink-0" />
      <span className="truncate">{item.label}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 shrink-0" />
      )}
      {badge && (
        <span className="ml-auto">
          <NavCountBadge endpoint={badge} variant="inline" enabled={!!isAuthed} />
        </span>
      )}
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
  const t = useUILanguageText("Navigation");
  const tCommunity = useUILanguageText("Navigation Community");
  const [activeTab, setActiveTab] = useState<ActiveTab>("book");
  const [showCategories, setShowCategories] = useState(false);

  if (!isOpen) return null;

  const isActive = (path: string) => pathname === path;

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

  const tabBtn = (tab: ActiveTab, Icon: LucideIcon, label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      aria-label={label}
      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
        activeTab === tab
          ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/30"
          : "text-white/35 hover:text-white/70 hover:bg-white/8"
      }`}
    >
      <Icon size={18} />
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      {/* Sidebar */}
      <aside
        className="fixed top-0 right-0 z-50 flex h-full w-[72%] max-w-[300px] flex-col overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(160deg, #0e1020 0%, #111827 100%)" }}
      >
        {/* ── Donate — always at top ── */}
        <div className="shrink-0 px-4 pt-5 pb-3">
          <Link
            href="/donate"
            prefetch={false}
            onClick={onClose}
            className="block w-full rounded-full bg-gradient-to-r from-rose-500 to-red-600 py-2.5 text-center text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:brightness-110 active:scale-[0.98]"
          >
            {t("Donate For Inkura")}
          </Link>
        </div>

        {/* ── User info ── */}
        <div className="shrink-0 px-4 pb-3">
          {isAuthed ? (
            <Link href="/profile" prefetch={false} onClick={onClose} className="group flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-purple-500/40 ring-offset-1 ring-offset-[#0e1020]">
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
              <span className="truncate text-sm font-semibold text-white/85 group-hover:text-white transition-colors">
                {displayName}
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
                <img src={userImage} alt="" className="h-full w-full object-cover" />
              </div>
              <span className="truncate text-sm font-semibold text-white/85">{displayName}</span>
            </div>
          )}
        </div>

        <div className="mx-4 h-px shrink-0 bg-white/[0.07]" />

        {/* ── Main: left tabs + right nav ── */}
        <div className="flex min-h-0 flex-1">
          {/* Left tab column */}
          <div className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-white/[0.07] py-4">
            {tabBtn("book", BookOpen, "Browse")}
            {tabBtn("settings", Settings, "Settings")}

            {/* Chat — direct link */}
            <Link
              href="/chat"
              prefetch={false}
              onClick={onClose}
              aria-label="Chat Elya"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white/35 transition-all hover:bg-white/8 hover:text-white/70"
            >
              <MessageCircle size={18} />
            </Link>
          </div>

          {/* Right nav column */}
          <div className="flex-1 overflow-y-auto py-3 pr-2 pl-1">
            {activeTab === "book" ? (
              <nav className="space-y-0.5">
                {bookTop.map((item) => (
                  <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onClose} />
                ))}

                {/* Categories expandable */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowCategories((v) => !v)}
                    className="flex w-full items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/8 hover:text-white"
                  >
                    <span className="flex items-center gap-2.5">
                      <Tags size={15} className="shrink-0" />
                      {t("Categories")}
                    </span>
                    {showCategories ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {showCategories && (
                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/[0.07] pl-3">
                      {categoryItems.map((item) => (
                        <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onClose} />
                      ))}
                    </div>
                  )}
                </div>

                {bookBottom.map((item) => (
                  <NavLink key={item.href} item={item} active={isActive(item.href)} onClick={onClose} />
                ))}
              </nav>
            ) : (
              <nav className="space-y-0.5">
                {settingsItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    onClick={onClose}
                    isAuthed={isAuthed}
                    badge={
                      item.href === "/notifications"
                        ? "/api/notifications/unread-count"
                        : item.href === "/admin-report"
                          ? "/api/admin-report/unread-count"
                          : undefined
                    }
                  />
                ))}

                {/* Dark mode toggle */}
                <div className="mt-2 border-t border-white/[0.07] pt-3">
                  <div className="flex items-center justify-between rounded-lg px-3 py-2">
                    <span className="text-sm text-white/60">{t("Theme")}</span>
                    <button
                      onClick={toggleDarkMode}
                      className={`flex h-7 w-12 items-center rounded-full px-1 transition-all ${
                        isDarkMode ? "justify-end bg-gradient-to-r from-blue-600 to-purple-600" : "justify-start bg-white/20"
                      }`}
                    >
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md">
                        {isDarkMode ? <Moon size={12} className="text-indigo-700" /> : <Sun size={12} className="text-yellow-600" />}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Logout / Sign In */}
                <div>
                  {isAuthed ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                    >
                      {t("Logout")}
                    </button>
                  ) : (
                    <Link
                      href="/auth/signin"
                      prefetch={false}
                      onClick={onClose}
                      className="block rounded-lg px-3 py-2 text-sm font-semibold text-purple-400 transition-colors hover:bg-purple-500/10 hover:text-purple-300"
                    >
                      {t("Sign In")}
                    </Link>
                  )}
                </div>
              </nav>
            )}
          </div>
        </div>

        {/* ── Back — always at bottom ── */}
        <div className="shrink-0 border-t border-white/[0.07] px-4 pb-6 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] py-2.5 text-sm font-medium text-white/45 transition hover:border-white/25 hover:text-white/75"
          >
            <ArrowLeft size={15} />
            <span>{t("Back")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
