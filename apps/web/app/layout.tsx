import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "../lib/fontawesome";
import CustomCursor from "./components/CustomCursor";
import SessionWrapper from "./components/SessionWrapper";
import LayoutClientWrapper from "./components/LayoutClientWrapper";

// Banyak page membaca database (Prisma). Di Next 15, kalau route dianggap static,
// Next akan prerender saat build dan bisa gagal kalau DATABASE_URL belum diset.
// Dengan ini, seluruh segmen app dipaksa dynamic (render per-request).
export const dynamic = "force-dynamic";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased relative`}>
        <SessionWrapper>
          <CustomCursor />
          <LayoutClientWrapper>{children}</LayoutClientWrapper>
        </SessionWrapper>
      </body>
    </html>
  );
}
