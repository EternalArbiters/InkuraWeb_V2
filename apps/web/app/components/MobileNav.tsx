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
  const [activeTab, setActiveTab] = useState<ActiveTab>("book");
  const [showCategories, setShowCategories] = useState(false);

  if (!isOpen) return null;

  const isActive = (path: string) => pathname === path;

  /* ── Nav item lists ── */
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

  /* ── Reusable nav link ── */
  const NavLink = ({ item, badge }: { item: NavItem; badge?: string }) => {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        prefetch={false}
        onClick={onClose}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
          active
            ? "bg-white/12 font-semibold text-white"
            : "text-white/55 hover:bg-white/8 hover:text-white/85"
        }`}
      >
        <item.Icon size={14} className="shrink-0" />
        <span className="truncate">{item.label}</span>
        {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />}
        {badge && (
          <span className="ml-auto">
            <NavCountBadge endpoint={badge} variant="inline" enabled={!!isAuthed} />
          </span>
        )}
      </Link>
    );
  };

  /* ── Tab icon button ── */
  const TabBtn = ({ tab, Icon }: { tab: ActiveTab; Icon: LucideIcon }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 ${
        activeTab === tab
          ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-600/35"
          : "bg-white/8 text-white/40 hover:bg-white/14 hover:text-white/70"
      }`}
    >
      <Icon size={19} />
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* ════ Sidebar panel ════ */}
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-[72%] max-w-xs flex-col overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(160deg,#0d0f1c 0%,#111828 100%)" }}
      >

        {/* ── [1] Donate — always top ── */}
        <div className="shrink-0 px-4 pt-5 pb-4">
          <Link
            href="/donate"
            prefetch={false}
            onClick={onClose}
            className="block w-full rounded-full bg-gradient-to-r from-rose-500 to-red-600 py-2.5 text-center text-sm font-bold text-white shadow-md shadow-red-600/25 transition hover:brightness-110 active:scale-[0.98]"
          >
            {t("Donate For Inkura")}
          </Link>
        </div>

        {/* thin rule */}
        <div className="mx-4 h-px shrink-0 bg-white/[0.08]" />

        {/* ── [2] Main area: LEFT column + RIGHT column ── */}
        <div className="flex min-h-0 flex-1">

          {/* ── LEFT COLUMN: avatar → buttons ── */}
          <div className="flex w-[72px] shrink-0 flex-col items-center border-r border-white/[0.08] py-5">

            {/* Profile photo — large circle */}
            {isAuthed ? (
              <Link href="/profile" prefetch={false} onClick={onClose} className="group">
                <div className="h-[58px] w-[58px] overflow-hidden rounded-full ring-2 ring-purple-500/50 ring-offset-2 ring-offset-[#0d0f1c] transition group-hover:ring-purple-400/70">
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
              <div className="h-[58px] w-[58px] overflow-hidden rounded-full ring-2 ring-white/20">
                <img src={userImage} alt="" className="h-full w-full object-cover" />
              </div>
            )}

            {/* separator */}
            <div className="my-4 h-px w-9 bg-white/[0.1]" />

            {/* Book tab */}
            <TabBtn tab="book" Icon={BookOpen} />

            <div className="my-2" />

            {/* Settings tab */}
            <TabBtn tab="settings" Icon={Settings} />

            <div className="my-2" />

            {/* Chat — direct link */}
            <Link
              href="/chat"
              prefetch={false}
              onClick={onClose}
              aria-label="Chat Elya"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-white/40 transition-all hover:bg-white/14 hover:text-white/70"
            >
              <MessageCircle size={19} />
            </Link>
          </div>

          {/* ── RIGHT COLUMN: username → nav items ── */}
          <div className="flex min-h-0 flex-1 flex-col">

            {/* User info — top of right column */}
            <div className="shrink-0 px-4 py-5">
              {isAuthed ? (
                <Link href="/profile" prefetch={false} onClick={onClose} className="group block">
                  <p className="truncate text-sm font-bold leading-tight text-white transition group-hover:text-white/80">
                    {displayName}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/35">View profile →</p>
                </Link>
              ) : (
                <p className="truncate text-sm font-bold text-white/80">{displayName}</p>
              )}
            </div>

            {/* thin rule */}
            <div className="mx-3 h-px shrink-0 bg-white/[0.08]" />

            {/* Nav items — scrollable */}
            <div className="flex-1 overflow-y-auto py-2 pr-2 pl-1">

              {activeTab === "book" ? (
                <nav className="space-y-0.5">
                  {bookTop.map((item) => <NavLink key={item.href} item={item} />)}

                  {/* Categories expandable */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowCategories((v) => !v)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-white/55 transition-colors hover:bg-white/8 hover:text-white/85"
                    >
                      <span className="flex items-center gap-2.5">
                        <Tags size={14} className="shrink-0" />
                        {t("Categories")}
                      </span>
                      {showCategories ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    {showCategories && (
                      <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/[0.08] pl-3">
                        {categoryItems.map((item) => <NavLink key={item.href} item={item} />)}
                      </div>
                    )}
                  </div>

                  {bookBottom.map((item) => <NavLink key={item.href} item={item} />)}
                </nav>
              ) : (
                <nav className="space-y-0.5">
                  {settingsItems.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      badge={
                        item.href === "/notifications" ? "/api/notifications/unread-count"
                        : item.href === "/admin-report" ? "/api/admin-report/unread-count"
                        : undefined
                      }
                    />
                  ))}

                  {/* Theme toggle */}
                  <div className="mt-2 border-t border-white/[0.08] pt-3">
                    <div className="flex items-center justify-between rounded-lg px-3 py-2">
                      <span className="text-sm text-white/55">{t("Theme")}</span>
                      <button
                        onClick={toggleDarkMode}
                        className={`flex h-7 w-12 items-center rounded-full px-1 transition-all ${
                          isDarkMode ? "justify-end bg-gradient-to-r from-blue-600 to-purple-600" : "justify-start bg-white/20"
                        }`}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white shadow">
                          {isDarkMode ? <Moon size={11} className="text-indigo-700" /> : <Sun size={11} className="text-yellow-600" />}
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Logout / Sign In */}
                  {isAuthed ? (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                    >
                      {t("Logout")}
                    </button>
                  ) : (
                    <Link
                      href="/auth/signin"
                      prefetch={false}
                      onClick={onClose}
                      className="block rounded-lg px-3 py-2 text-sm font-semibold text-purple-400 transition hover:bg-purple-500/10"
                    >
                      {t("Sign In")}
                    </Link>
                  )}
                </nav>
              )}
            </div>
          </div>
        </div>

        {/* ── [3] Back — always bottom ── */}
        <div className="shrink-0 border-t border-white/[0.08] px-4 pb-6 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] py-2.5 text-sm text-white/40 transition hover:border-white/25 hover:text-white/65"
          >
            <ArrowLeft size={14} />
            <span>{t("Back")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
