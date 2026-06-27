"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  username: string;
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
  username,
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
  const [showCategoriesClassic, setShowCategoriesClassic] = useState(false);

  // Signal to FloatingActions to hide scroll-to-top while nav is open
  useEffect(() => {
    if (!isOpen) return;
    document.documentElement.dataset.navOpen = "1";
    return () => { delete document.documentElement.dataset.navOpen; };
  }, [isOpen]);

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

  /* ── Modern mode: orbital nav ── */

  type OrbitLink   = { type: "link";   href: string; label: string; Icon: LucideIcon; red?: boolean };
  type OrbitClose  = { type: "close";  label: string; Icon: LucideIcon };
  type OrbitTheme  = { type: "theme";  label: string; Icon: LucideIcon };
  type OrbitLogout = { type: "logout"; label: string; Icon: LucideIcon };
  type OrbitItem   = OrbitLink | OrbitClose | OrbitTheme | OrbitLogout;

  const bookOrbit: OrbitItem[] = [
    { type: "link", href: "/donate",           label: t("Donate For Inkura"), Icon: Gift,        red: true },
    { type: "link", href: "/search",           label: t("Advanced Search"),   Icon: Search },
    { type: "link", href: "/all",              label: t("All"),               Icon: LayoutGrid },
    { type: "link", href: "/novel",            label: t("Novel"),             Icon: BookText },
    { type: "link", href: "/comic",            label: t("Comic"),             Icon: PanelsTopLeft },
    { type: "link", href: "/film",             label: t("Film"),              Icon: Clapperboard },
    { type: "link", href: "/genre",            label: t("Genres"),            Icon: Tags },
    { type: "link", href: "/library",          label: t("Library"),           Icon: Bookmark },
    { type: "link", href: "/settings/history", label: t("History"),           Icon: History },
    { type: "link", href: "/lists",            label: t("Collection"),        Icon: Layers },
  ];

  const settingsOrbit: OrbitItem[] = [
    { type: "link", href: "/donate",            label: t("Donate For Inkura"),       Icon: Gift,       red: true },
    { type: "link", href: "/notifications",     label: t("Notifications"),           Icon: Bell },
    { type: "link", href: "/studio",            label: t("Upload"),                  Icon: Upload },
    { type: "link", href: "/community",         label: t("Community"),               Icon: Users },
    { type: "link", href: "/community/ranking", label: tCommunity("Ranking"),        Icon: Trophy },
    { type: "link", href: "/community/title",   label: tCommunity("Title"),          Icon: Award },
    { type: "link", href: "/settings/account",  label: t("Account"),                 Icon: User },
    ...(isAuthed ? [{ type: "link" as const, href: "/settings/payout", label: t("Finances"),          Icon: Wallet }] : []),
    ...(isAuthed ? [{ type: "link" as const, href: "/admin-report",    label: t("Admin Report"),      Icon: ShieldAlert }] : []),
    ...(isAdmin  ? [{ type: "link" as const, href: "/admin/reports",   label: t("Content Reports"),   Icon: ShieldAlert }] : []),
    ...(isAdmin  ? [{ type: "link" as const, href: "/admin/taxonomy",  label: t("Taxonomy"),          Icon: ListTree }] : []),
    ...(isAdmin  ? [{ type: "link" as const, href: "/admin/donations", label: t("Creator Donations"), Icon: Gift }] : []),
    ...(isAdmin  ? [{ type: "link" as const, href: "/admin/analytics", label: t("Analytics"),         Icon: BarChart3 }] : []),
    { type: "theme",  label: t("Theme"),  Icon: isDarkMode ? Moon : Sun },
    ...(isAuthed
      ? [{ type: "logout" as const, label: t("Logout"),   Icon: ArrowLeft }]
      : [{ type: "link"   as const, href: "/auth/signin", label: t("Sign In"), Icon: User }]
    ),
  ];

  const orbitItems = activeTab === "book" ? bookOrbit : settingsOrbit;
  const N = orbitItems.length;
  // Vertical half-span: space items evenly so each pill (≈30px) has a 12px gap → 42px slot.
  // Horizontal radius capped at 200px so labels don't fall off screen.
  const VERT_R  = N <= 1 ? 100 : Math.ceil((N - 1) * 42 / 2);
  const HORIZ_R = Math.min(200, VERT_R);
  // Minimum x from circle center so items never overlap the profile photo (circle r=55 + 10px gap).
  const MIN_OX  = 65;

  return (
    <>
      <aside
        className="fixed inset-0 z-50 overflow-hidden"
        style={{
          background: "linear-gradient(150deg,rgba(6,8,20,0.30) 0%,rgba(10,15,28,0.28) 60%,rgba(14,10,30,0.25) 100%)",
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06), inset 1px 0 0 rgba(255,255,255,0.04)",
        }}
        onClick={onClose}
      >
        {/* Subtle noise/grain overlay for glass feel */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            background:
              "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(99,57,200,0.08) 0%, transparent 70%), " +
              "radial-gradient(ellipse 50% 80% at 80% 20%, rgba(30,80,180,0.06) 0%, transparent 65%)",
          }}
        />

        {/* ── Profile circle: anchored at left-center ── */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            left: "22%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 30,
          }}
        >
          <div style={{ position: "relative", width: 110, height: 110 }}>

            {/* Circle */}
            {isAuthed ? (
              <Link href="/profile" prefetch={false} onClick={onClose} className="group block">
                <div
                  className="overflow-hidden rounded-full transition group-hover:scale-[1.03]"
                  style={{
                    width: 110,
                    height: 110,
                    boxShadow: "0 0 0 3px rgba(139,92,246,0.55), 0 0 0 6px rgba(59,130,246,0.18)",
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
                style={{ width: 110, height: 110, boxShadow: "0 0 0 3px rgba(255,255,255,0.15)" }}
              >
                <img src={userImage} alt="" className="h-full w-full object-cover" />
              </div>
            )}

            {/* 3 tab buttons — overlap bottom edge */}
            <div
              style={{
                position: "absolute",
                bottom: -18,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: 7,
                zIndex: 20,
              }}
            >
              {([
                { tab: "book" as ActiveTab,     Icon: BookOpen,     label: "Browse"   },
                { tab: "settings" as ActiveTab, Icon: Settings,     label: "Settings" },
              ] as const).map(({ tab, Icon, label }) => (
                <button
                  key={tab}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
                  aria-label={label}
                  style={{
                    width: 34, height: 34, borderRadius: "50%", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: activeTab === tab ? "linear-gradient(135deg,#3b82f6,#9333ea)" : "rgba(14,18,32,0.95)",
                    color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.45)",
                    boxShadow: activeTab === tab
                      ? "0 4px 14px rgba(147,51,234,0.45)"
                      : "0 2px 8px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.10)",
                    transition: "all 0.2s",
                  }}
                >
                  <Icon size={15} />
                </button>
              ))}
              <Link
                href="/chat"
                prefetch={false}
                onClick={onClose}
                aria-label="Chat Elya"
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(14,18,32,0.95)",
                  color: "rgba(255,255,255,0.45)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.10)",
                  transition: "all 0.2s",
                }}
              >
                <MessageCircle size={15} />
              </Link>
            </div>

            {/* Username badge — overlap top-right edge */}
            {isAuthed ? (
              <Link
                href="/profile"
                prefetch={false}
                onClick={onClose}
                style={{ position: "absolute", top: 7, left: 94, zIndex: 20, display: "block" }}
              >
                {/* display name — bordered card */}
                <div
                  style={{
                    background: "linear-gradient(135deg,rgba(88,28,135,0.80) 0%,rgba(30,58,138,0.65) 100%)",
                    border: "1px solid rgba(139,92,246,0.40)",
                    borderRadius: 10,
                    padding: "5px 12px 5px 20px",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: "white", maxWidth: 108, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayName}
                  </p>
                </div>
                {/* username — floating below, no border, samar */}
                {username ? (
                  <p style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.35)",
                    marginTop: 4,
                    paddingLeft: 20,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 140,
                    letterSpacing: "0.01em",
                  }}>
                    @{username}
                  </p>
                ) : null}
              </Link>
            ) : (
              <div style={{ position: "absolute", top: 7, left: 94, zIndex: 20 }}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    padding: "5px 12px 5px 20px",
                    whiteSpace: "nowrap",
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.62)", maxWidth: 108, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {displayName}
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── Orbital nav items: right semi-circle around profile center ── */}
        {orbitItems.map((item, i) => {
          // Even vertical spacing: distribute items uniformly within [-VERT_R, +VERT_R]
          const ySlot = N <= 1 ? 0 : (2 * VERT_R) / (N - 1);
          const oy = Math.round(i * ySlot - VERT_R);
          // Ellipse: x = HORIZ_R * sqrt(1 - (oy/VERT_R)²), minimum MIN_OX
          const ellipseX = VERT_R === 0
            ? HORIZ_R
            : HORIZ_R * Math.sqrt(Math.max(0, 1 - (oy / VERT_R) ** 2));
          const ox = Math.max(MIN_OX, Math.round(ellipseX));
          const active = item.type === "link" && isActive((item as OrbitLink).href);
          const isRed = (item as OrbitLink).red || item.type === "logout";

          const pillCls = [
            "inline-flex items-center gap-2 px-2 py-[5px] text-[13px] transition-all duration-150 active:scale-95 select-none",
            isRed
              ? "font-semibold text-red-400"
              : item.type === "close"
                ? "text-white/50 hover:text-white/75"
                : active
                  ? "font-semibold text-white"
                  : "text-white/85 hover:text-white",
          ].join(" ");

          const dropFilter = isRed
            ? "drop-shadow(0 1px 5px rgba(0,0,0,1)) drop-shadow(0 0 10px rgba(0,0,0,0.9)) drop-shadow(0 0 6px rgba(185,28,28,0.5))"
            : active
              ? "drop-shadow(0 1px 5px rgba(0,0,0,1)) drop-shadow(0 0 10px rgba(0,0,0,0.9)) drop-shadow(0 0 8px rgba(139,92,246,0.7))"
              : "drop-shadow(0 1px 5px rgba(0,0,0,1)) drop-shadow(0 0 12px rgba(0,0,0,0.95))";

          const content = (
            <>
              <item.Icon size={13} className="shrink-0" />
              <span className="truncate" style={{ maxWidth: 130 }}>{item.label}</span>
              {active && (
                <span className="ml-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500" />
              )}
            </>
          );

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `calc(22% + ${ox}px)`,
                top: `calc(50% + ${oy}px)`,
                transform: "translateY(-50%)",
                zIndex: 20,
                filter: dropFilter,
              }}
            >
              {item.type === "close" ? (
                <button type="button" onClick={onClose} className={pillCls}>{content}</button>
              ) : item.type === "theme" ? (
                <button type="button" onClick={toggleDarkMode} className={pillCls}>{content}</button>
              ) : item.type === "logout" ? (
                <button type="button" onClick={handleLogout} className={pillCls}>{content}</button>
              ) : (
                <Link href={(item as OrbitLink).href} prefetch={false} onClick={onClose} className={pillCls}>
                  {content}
                </Link>
              )}
            </div>
          );
        })}

      </aside>

    </>
  );
}
