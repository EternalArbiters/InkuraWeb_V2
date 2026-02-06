"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu, X, Search, Upload, Settings, LogOut, Users, History, ListOrdered, Bookmark,
  Bell,
} from "lucide-react";
import IconButton from "./IconButton";
import MobileNav from "./MobileNav";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`text-sm font-medium px-3 py-1 rounded transition-all ${isActive
        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white"
        : "hover:bg-gradient-to-r from-pink-500 to-purple-500 hover:text-white text-gray-800 dark:text-gray-200"
        }`}
    >
      {children}
    </Link>
  );
}

export default function DashboardNavbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAuthed = !!session?.user?.id;

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(true);
  const [dropdown, setDropdown] = useState("");
  const [searchType, setSearchType] = useState("title");
  const [searchQuery, setSearchQuery] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const displayName = session?.user?.name || session?.user?.email?.split("@")[0] || (isAuthed ? "User" : "Guest");
  const userImage = session?.user?.image || "/images/default-avatar.png";

  // Set theme
  useEffect(() => {
    const dark = localStorage.getItem("theme") === "dark";
    setIsDarkMode(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  // Unread notifications badge
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!isAuthed) {
        if (mounted) setUnreadCount(0);
        return;
      }
      const res = await fetch("/api/notifications", { cache: "no-store" as any }).catch(() => null);
      if (!res) return;
      const data = await res.json().catch(() => ({} as any));
      if (mounted) setUnreadCount(Number(data?.unreadCount || 0));
    };
    run();
    const t = setInterval(run, 30000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, [isAuthed]);

  // Hide scroll button if menu open
  useEffect(() => {
    const scrollBtn = document.getElementById("scrollToTop");
    if (scrollBtn) {
      scrollBtn.style.display = isMenuOpen ? "none" : "block";
    }
  }, [isMenuOpen]);

  // Hide navbar on scroll down (only mobile)
  useEffect(() => {
    let lastY = window.scrollY;
    const handleScroll = () => {
      const current = window.scrollY;
      setScrollY(current);
      if (current <= 10) {
        setShowMobileNav(true);
      } else if (current > lastY) {
        setShowMobileNav(false);
      } else {
        setShowMobileNav(true);
      }
      lastY = current;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleTap = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const clickedInsideSidebar = target.closest("aside");
      const clickedInsideHeader = target.closest("header");

      // Kalau klik terjadi di dalam sidebar atau header, jangan tutup
      if (clickedInsideSidebar || clickedInsideHeader) return;

      // Kalau klik terjadi di luar sidebar dan header
      if (isMenuOpen && !showMobileNav) {
        setIsMenuOpen(false);
        setShowMobileNav(true);
      } else if (isMenuOpen) {
        setIsMenuOpen(false);
      } else if (!isMenuOpen && !showMobileNav && scrollY > 20) {
        setShowMobileNav(true);
      } else if (!isMenuOpen && showMobileNav && scrollY > 20) {
        setShowMobileNav(false);
      }
    };

    document.addEventListener("click", handleTap);
    return () => document.removeEventListener("click", handleTap);
  }, [isMenuOpen, showMobileNav, scrollY]);


  const toggleDarkMode = useCallback(() => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newTheme);
  }, [isDarkMode]);

  const toggleDropdown = useCallback((id: string) => {
    setDropdown((prev) => (prev === id ? "" : id));
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/search?type=${searchType}&q=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [router, searchType, searchQuery]
  );

  const handleLogout = useCallback(() => {
    signOut();
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-transform duration-300 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 shadow-md border-b dark:border-gray-800 ${showMobileNav ? "" : "translate-y-[-100%] md:translate-y-0"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between space-x-4">
          {/* Left (Logo + Menu button) */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <Link href="/home" className="flex items-center gap-2">
              <Image src="/logo-inkura.png" alt="Inkura" width={36} height={36} />
              <span className="text-2xl font-bold text-gray-800 dark:text-white">INKURA</span>
            </Link>
            <div className="flex items-center gap-2 md:hidden ml-2">
              <IconButton icon={<Search size={22} />} onClick={() => setDropdown("search")} />
              <button onClick={() => setIsMenuOpen((prev) => !prev)}>
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>

          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 mx-auto">
            {["All", "Novel", "Comic", "Film"].map((item) => (
              <NavLink key={item} href={`/${item.toLowerCase()}`}>
                {item}
              </NavLink>
            ))}

            {/* Search */}
            <form onSubmit={handleSearch} className="flex items-center w-[420px]">
              <div className="flex flex-1 border border-blue-500 bg-white dark:bg-gray-800 rounded-full overflow-hidden shadow-md">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="px-3 text-sm border-r bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                >
                  {["title", "tags", "authors", "translator", "users"].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt[0].toUpperCase() + opt.slice(1)}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder={`Search ${searchType}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 bg-transparent text-gray-800 dark:text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 bg-gradient-to-r from-blue-500 via-pink-500 to-purple-500 text-white"
                >
                  <Search size={18} strokeWidth={2.5} />
                </button>
              </div>
            </form>

            {/* Icons */}
            <div className="flex items-center gap-0 pl-6 h-10">
              <IconButton icon={<Upload size={22} />} label="Studio" href="/studio" />
              <div className="relative">
                <IconButton icon={<ListOrdered size={22} />} label="Category" onClick={() => toggleDropdown("category")} />
                {dropdown === "category" && (
                  <div className="absolute mt-2 right-0 z-50 bg-white dark:bg-gray-800 border rounded shadow-lg">
                    {["genre", "region", "translated"].map((path) => (
                      <Link
                        key={path}
                        href={`/${path}`}
                        className="block px-4 py-2 hover:bg-gradient-to-r from-pink-500 to-purple-500 hover:text-white"
                      >
                        {path[0].toUpperCase() + path.slice(1)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <IconButton icon={<Users size={22} />} label="Community" href="/community" />
              <div className="relative">
                <IconButton icon={<Bell size={22} />} label="Notifications" href="/notifications" />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </div>
              <IconButton icon={<Bookmark size={22} />} label="Library" href="/library" />
              <IconButton icon={<History size={22} />} label="History" href="/settings/history" />
              <div className="relative">
                <IconButton icon={<Settings size={22} />} label="Settings" onClick={() => toggleDropdown("settings")} />
                {dropdown === "settings" && (
                  <div className="absolute mt-2 right-0 z-50 bg-white dark:bg-gray-800 border rounded shadow-lg w-48">
                    <Link href="/settings/account" className="block px-4 py-2 hover:bg-gradient-to-r from-pink-500 to-purple-500 hover:text-white">Account</Link>
                    {session?.user?.role === "ADMIN" ? (
                      <Link href="/admin/reports" className="block px-4 py-2 hover:bg-gradient-to-r from-pink-500 to-purple-500 hover:text-white">
                        Admin Reports
                      </Link>
                    ) : null}
                    <div className="px-4 py-2">
                      <button
                        onClick={toggleDarkMode}
                        className={`w-14 h-8 rounded-full flex items-center px-1 shadow-inner ${isDarkMode ? "bg-gradient-to-r from-indigo-600 to-purple-600 justify-end" : "bg-gray-300 justify-start"
                          }`}
                      >
                        <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                          {isDarkMode ? "" : ""}
                        </div>
                      </button>
                    </div>
                    {isAuthed ? (
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <LogOut size={16} /> Logout
                      </button>
                    ) : (
                      <Link href="/auth/signin" className="block px-4 py-2 hover:bg-gradient-to-r from-pink-500 to-purple-500 hover:text-white">
                        Sign In
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Info (Desktop Only) */}
              <div className="ml-4 hidden md:flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800 dark:text-white truncate">{displayName}</span>
                <Image src={userImage} alt="pp" width={32} height={32} className="rounded-full border border-gray-300 dark:border-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {!isMenuOpen && (
          <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 animate-pulse" />
        )}
      </header>

      <MobileNav
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        displayName={displayName}
        userImage={userImage}
        toggleDarkMode={toggleDarkMode}
        handleLogout={handleLogout}
        isDarkMode={isDarkMode}
        isAuthed={isAuthed}
      />

      <AnimatePresence>
        {dropdown === "search" && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-6 px-4"
            onClick={() => setDropdown("")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 relative"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <h2 className="text-base font-semibold mb-4 text-gray-800 dark:text-white">
              Search anything on <span className="text-pink-500 font-bold">Inkura</span>
              </h2>
              <form onSubmit={handleSearch} className="flex items-stretch w-full">
                <select
                  value={searchType}
                  onChange={e => setSearchType(e.target.value)}
                  className="px-2 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-white border-r border-gray-300 dark:border-gray-700 rounded-l-full"
                >
                  {["title", "tags", "authors", "translator", "users"].map(opt => (
                    <option key={opt} value={opt}>{opt[0].toUpperCase() + opt.slice(1)}</option>
                  ))}
                </select>
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search ${searchType}...`}
                  className="flex-1 px-4 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-r-full bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110 transition"
                >
                  <Search size={16} />
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
