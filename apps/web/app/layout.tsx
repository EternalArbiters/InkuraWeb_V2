import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "../lib/fontawesome";
import CustomCursor from "./components/CustomCursor";
import SessionWrapper from "./components/SessionWrapper";
import LayoutClientWrapper from "./components/LayoutClientWrapper";

// Banyak page membaca database (Prisma). Di Next 14, kalau route dianggap static,
// Next bisa prerender saat build dan bikin error kalau DATABASE_URL / env belum siap.
// Dengan ini, seluruh segmen app dipaksa dynamic (render per-request).
export const dynamic = "force-dynamic";

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
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased relative`}
      >
        <SessionWrapper>
          <CustomCursor />
          <LayoutClientWrapper>{children}</LayoutClientWrapper>
        </SessionWrapper>
      </body>
    </html>
  );
}
