"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import IconButton from "./IconButton";
import MobileNav from "./MobileNav";
import DesktopNavLinks from "./dashboardNavbar/DesktopNavLinks";
import DesktopSearch from "./dashboardNavbar/DesktopSearch";
import DesktopActions from "./dashboardNavbar/DesktopActions";
import SearchOverlay from "./dashboardNavbar/SearchOverlay";
import ProgressBar from "./dashboardNavbar/ProgressBar";
import { useThemeToggle } from "./dashboardNavbar/useThemeToggle";
import { useMobileHeaderVisibility } from "./dashboardNavbar/useMobileHeaderVisibility";
import { useNavigationProgress } from "./dashboardNavbar/useNavigationProgress";
import { useUILanguageText } from "./ui-language/UILanguageProvider";
import { useUITheme } from "./ui-theme/UIThemeProvider";

export default function DashboardNavbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthed = !!session?.user?.id;
  const t = useUILanguageText("Navigation");
  const { uiTheme } = useUITheme();
  const isModern = uiTheme === "modern";

  // Netflix-style navbar: transparent over the full-bleed Home hero at the top
  // of the page, fading to a solid bar once the user scrolls.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isModernHome = isModern && pathname === "/home";
  const transparentNav = isModernHome && !scrolled;
  const navSolid = isModern && !transparentNav;

  const { isDarkMode, toggleDarkMode } = useThemeToggle();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdown, setDropdown] = useState("");
  const [searchType, setSearchType] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");

  const { showMobileNav } = useMobileHeaderVisibility({ isMenuOpen, setIsMenuOpen });
  const { isNavigating, navProgress, startNavigation } = useNavigationProgress(pathname);

  const displayName =
    session?.user?.name ||
    session?.user?.email?.split("@")[0] ||
    (isAuthed ? t("User") : t("Guest"));

  const userImage = session?.user?.image || "/images/default-avatar.png";
  const avatarFocusX = Number.isFinite(Number((session?.user as any)?.avatarFocusX))
    ? Number((session?.user as any)?.avatarFocusX)
    : 50;
  const avatarFocusY = Number.isFinite(Number((session?.user as any)?.avatarFocusY))
    ? Number((session?.user as any)?.avatarFocusY)
    : 50;
  const avatarZoom = Number.isFinite(Number((session?.user as any)?.avatarZoom))
    ? Math.max(1, Number((session?.user as any)?.avatarZoom))
    : 1;

  const toggleDropdown = useCallback((id: string) => {
    setDropdown((prev) => (prev === id ? "" : id));
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        startNavigation();
        router.push(`/search?type=${searchType}&q=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [router, searchType, searchQuery, startNavigation]
  );

  const handleLogout = useCallback(() => {
    signOut();
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 ${
          isModern ? "" : "backdrop-blur-md bg-white/70 dark:bg-gray-900/70 shadow-md border-b dark:border-gray-800"
        } ${showMobileNav ? "" : "translate-y-[-100%] md:translate-y-0"}`}
      >
        {isModern && (
          <>
            {/* solid bar — fades in once scrolled */}
            <div
              className={`pointer-events-none absolute inset-0 -z-10 border-b border-[var(--ink-border)] bg-[var(--ink-bg)]/85 backdrop-blur transition-opacity duration-300 ${
                navSolid ? "opacity-100" : "opacity-0"
              }`}
            />
            {/* legibility scrim while transparent over the hero */}
            <div
              className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/25 to-transparent transition-opacity duration-300 ${
                transparentNav ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        )}
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between space-x-4">
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/home" className="flex items-center gap-2">
              <Image src="/logo-inkura.png" alt="Inkura" width={36} height={36} />
              <span
                className={`text-2xl tracking-tight ${isModern ? "font-semibold" : "font-bold"} ${
                  transparentNav
                    ? "text-white drop-shadow"
                    : isModern
                      ? "text-[var(--ink-fg)]"
                      : "text-gray-800 dark:text-white"
                }`}
              >
                INKURA
              </span>
            </Link>
            <div className={`flex items-center gap-2 md:hidden ml-2 ${transparentNav ? "text-white" : ""}`}>
              <IconButton icon={<Search size={22} />} label={t("Search")} onClick={() => setDropdown("search")} />
              <button onClick={() => setIsMenuOpen((prev) => !prev)} aria-label={t("Settings")}>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1 mx-auto">
            <DesktopNavLinks />

            <DesktopSearch
              searchType={searchType}
              setSearchType={setSearchType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSubmit={handleSearch}
            />

            <DesktopActions
              dropdown={dropdown}
              toggleDropdown={toggleDropdown}
              isAuthed={isAuthed}
              userRole={session?.user?.role}
              displayName={displayName}
              userImage={userImage}
              avatarFocusX={avatarFocusX}
              avatarFocusY={avatarFocusY}
              avatarZoom={avatarZoom}
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              handleLogout={handleLogout}
            />
          </div>
        </div>

        <ProgressBar isMenuOpen={isMenuOpen} isNavigating={isNavigating} navProgress={navProgress} />
      </header>

      <SearchOverlay
        open={dropdown === "search"}
        searchType={searchType}
        setSearchType={setSearchType}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSubmit={handleSearch}
        onClose={() => setDropdown("")}
      />

      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        displayName={displayName}
        userImage={userImage}
        avatarFocusX={avatarFocusX}
        avatarFocusY={avatarFocusY}
        avatarZoom={avatarZoom}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
        isDarkMode={isDarkMode}
        isAuthed={isAuthed}
        isAdmin={session?.user?.role === "ADMIN"}
      />
    </>
  );
}
