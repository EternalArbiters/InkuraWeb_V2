"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardNavbar from "./DashboardNavbar";
import FloatingActions from "./FloatingActions";
import { maybeSendSessionSeen, sendAnalyticsEvent } from "@/lib/analyticsClient";
import { useUILanguage } from "./ui-language/UILanguageProvider";
import { useUITheme } from "./ui-theme/UIThemeProvider";

function shouldShowNavbar(pathname: string) {
  return pathname !== "/" && !pathname.startsWith("/auth");
}

function isReaderRoute(pathname: string) {
  return /^\/w\/[^/]+\/read\/[^/]+(?:\/|$)/.test(pathname);
}

function canBypassOnboarding(pathname: string) {
  return pathname === "/onboarding" || pathname.startsWith("/auth") || pathname.startsWith("/api");
}

export default function LayoutClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, data: session } = useSession();
  const showNavbar = shouldShowNavbar(pathname);
  const hideMobileNavbarInReader = isReaderRoute(pathname);
  const { language } = useUILanguage();
  const { uiTheme } = useUITheme();
  // Modern Home runs a full-bleed cinematic hero that sits *under* the fixed
  // navbar (so there's no empty strip when the navbar auto-hides), and supplies
  // its own background — so we drop the default top padding + light background.
  const modernFullBleed = uiTheme === "modern" && pathname === "/home";

  useEffect(() => {
    document.documentElement.dataset.inkuraLanguage = language;
  }, [language]);

  useEffect(() => {
    const dark = localStorage.getItem("theme");
    const isDark = dark === null ? true : dark === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/api")) return;
    maybeSendSessionSeen(pathname);
    sendAnalyticsEvent({ eventType: "PAGE_VIEW", path: pathname, routeName: pathname });
  }, [pathname]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const onboardingState = (session?.user as any)?.profileOnboardingComplete;
    if (onboardingState !== false || canBypassOnboarding(pathname)) return;

    router.replace("/onboarding");
  }, [pathname, router, session, status]);

  return (
    <>
      {showNavbar && (
        hideMobileNavbarInReader ? <div className="hidden md:block"><DashboardNavbar /></div> : <DashboardNavbar />
      )}
      {showNavbar && <FloatingActions />}
      <div
        className={
          showNavbar
            ? modernFullBleed
              ? "min-h-screen"
              : hideMobileNavbarInReader
                ? "min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white md:pt-24"
                : "pt-24 min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white"
            : ""
        }
      >
        {children}
      </div>
    </>
  );
}
