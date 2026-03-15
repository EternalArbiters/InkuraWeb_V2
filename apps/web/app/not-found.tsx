import Link from "next/link";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export default async function NotFound() {
  const [tTitle, tDesc, tHome] = await Promise.all([
    getActiveUILanguageText("Error").catch(() => "404"),
    getActiveUILanguageText("This page could not be found.").catch(() => "Halaman ini belum di buat."),
    getActiveUILanguageText("Go to Home").catch(() => "Beranda"),
  ]);

  return (
    <main className="flex min-h-[calc(100vh-96px)] flex-col items-center justify-center gap-4 bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="text-center">
        <div className="text-6xl font-extrabold text-gray-300 dark:text-gray-700">404</div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{tDesc}</h1>
      </div>
      <Link
        href="/home"
        className="mt-4 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110"
      >
        {tHome}
      </Link>
    </main>
  );
}
