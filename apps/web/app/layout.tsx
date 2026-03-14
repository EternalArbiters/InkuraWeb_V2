import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../lib/fontawesome";
import CustomCursor from "./components/CustomCursor";
import SessionWrapper from "./components/SessionWrapper";
import LayoutClientWrapper from "./components/LayoutClientWrapper";
import UILanguageProvider from "./components/ui-language/UILanguageProvider";
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
  title: "Inkura",
  description: "An International Platform For Original Works Made Without AI",
  icons: {
    icon: "/logo-inkura.png",
  },
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
    <html lang={inkuraLanguageToHtmlLang(initialLanguage)} data-inkura-language={initialLanguage}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}>
        <SessionWrapper session={hydratedSession}>
          <UILanguageProvider catalogs={catalogs} initialLanguage={initialLanguage}>
            <CustomCursor />
            <LayoutClientWrapper>{children}</LayoutClientWrapper>
          </UILanguageProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
