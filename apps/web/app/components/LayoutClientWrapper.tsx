"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardNavbar from "./DashboardNavbar";
import FloatingActions from "./FloatingActions";
import { maybeSendSessionSeen, sendAnalyticsEvent } from "@/lib/analyticsClient";
import { useUILanguage } from "./ui-language/UILanguageProvider";

function shouldShowNavbar(pathname: string) {
  return pathname !== "/" && !pathname.startsWith("/auth");
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
  const { language } = useUILanguage();

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
      {showNavbar && <DashboardNavbar />}
      {showNavbar && <FloatingActions />}
      <div
        className={
          showNavbar
            ? "pt-24 min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-white"
            : ""
        }
      >
        {children}
      </div>
    </>
  );
}
