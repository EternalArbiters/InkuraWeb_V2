import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../lib/fontawesome";
import CustomCursor from "./components/CustomCursor";
import ForceUpdateGate from "./components/ForceUpdateGate";
import PullToRefresh from "./components/PullToRefresh";
import SessionWrapper from "./components/SessionWrapper";
import LayoutClientWrapper from "./components/LayoutClientWrapper";
import UILanguageProvider from "./components/ui-language/UILanguageProvider";
import { UIThemeProvider } from "./components/ui-theme/UIThemeProvider";
import { DarkModeScript } from "./components/dashboardNavbar/DarkModeScript";
import { inkuraLanguageToHtmlLang } from "@/lib/inkuraLanguage";
import { getSession } from "@/server/auth/session";
import { getAllUILanguageCatalogs } from "@/server/services/uiLanguage/catalog";
import { getActiveInkuraLanguage } from "@/server/services/uiLanguage/runtime";

// Root language bootstrap is request-aware so server-rendered text and client UI
// hydrate with the same active language on the very first paint.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hohoo",
  description: "An International Platform For Original Works Made Without AI",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo-inkura.png",
    apple: "/apple-touch-icon.png",
  },
  // v41: iOS "Add to Home Screen" — without these, Safari treats the installed
  // icon as a bookmark (opens inside normal Safari chrome instead of full-screen
  // standalone). Android already gets its "real app" look from the Capacitor
  // shell, so this is the iOS-only equivalent of that.
  appleWebApp: {
    capable: true,
    title: "Hohoo",
    // "black" (opaque, not "black-translucent"): deliberately NOT pairing this
    // with viewport-fit=cover below. This app has no app-wide safe-area-inset
    // handling yet (only a few components use it ad hoc), so content is kept
    // below the status bar rather than risking it rendering under the notch.
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  // Next's own defaults, restated: defining a custom `viewport` export replaces
  // the framework default entirely rather than merging with it.
  width: "device-width",
  initialScale: 1,
  themeColor: "#080f28",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [catalogs, session, initialLanguage] = await Promise.all([
    getAllUILanguageCatalogs(),
    getSession(),
    getActiveInkuraLanguage(),
  ]);

  const hydratedSession = session?.user
    ? {
        ...session,
        user: {
          ...session.user,
          inkuraLanguage: initialLanguage,
        },
      }
    : session;

  return (
    <html
      lang={inkuraLanguageToHtmlLang(initialLanguage)}
      data-inkura-language={initialLanguage}
      data-ui-theme="modern"
    >
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}>
        <DarkModeScript />
        <SessionWrapper session={hydratedSession}>
          <UILanguageProvider catalogs={catalogs} initialLanguage={initialLanguage}>
            <UIThemeProvider>
              <CustomCursor />
              <ForceUpdateGate />
              <PullToRefresh />
              <LayoutClientWrapper>{children}</LayoutClientWrapper>
            </UIThemeProvider>
          </UILanguageProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
