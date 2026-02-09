import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import PreferencesForm from "./PreferencesForm";
import { parseJsonStringArray } from "@/lib/prefs";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [user, genres, warnings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        matureOptIn: true,
        preferredLanguagesJson: true,
        blockedGenres: { select: { id: true } },
        blockedWarnings: { select: { id: true } },
      },
    }),
    prisma.genre.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.warningTag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  const initial = {
    matureOptIn: !!user?.matureOptIn,
    preferredLanguages: parseJsonStringArray(user?.preferredLanguagesJson),
    blockedGenreIds: user?.blockedGenres?.map((g) => g.id) || [],
    blockedWarningIds: user?.blockedWarnings?.map((w) => w.id) || [],
  };

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Account Settings</h1>
          <Link href="/" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
            ← Home
          </Link>
        </div>

        <PreferencesForm genres={genres as any} warnings={warnings as any} initial={initial} />
      </div>
    </main>
  );
}
