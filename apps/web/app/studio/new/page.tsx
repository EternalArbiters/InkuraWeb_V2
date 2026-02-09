import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import NewWorkForm from "./NewWorkForm";

export const dynamic = "force-dynamic";

export default async function NewWorkPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [genres, warningTags] = await Promise.all([
    prisma.genre.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.warningTag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Create New Work</h1>
          <Link href="/studio" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
            ← Back
          </Link>
        </div>

        <NewWorkForm genres={genres} warningTags={warningTags} />
      </div>
    </main>
  );
}
