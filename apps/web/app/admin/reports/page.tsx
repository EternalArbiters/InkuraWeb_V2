import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import AdminReportsClient from "./AdminReportsClient";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/home");
  }

  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { reporter: { select: { id: true, username: true, name: true } } },
  });

  const commentIds = Array.from(new Set(reports.map((r) => r.targetId))).filter(Boolean);
  const comments = commentIds.length
    ? await prisma.comment.findMany({
        where: { id: { in: commentIds } },
        select: {
          id: true,
          body: true,
          isHidden: true,
          createdAt: true,
          user: { select: { id: true, username: true, name: true } },
          chapter: { select: { id: true, title: true, number: true, work: { select: { id: true, title: true, slug: true } } } },
        },
      })
    : [];
  const commentMap = new Map(comments.map((c) => [c.id, c]));

  const initial = reports.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    reason: r.reason,
    reporter: r.reporter,
    targetId: r.targetId,
    comment: commentMap.get(r.targetId)
      ? {
          ...commentMap.get(r.targetId)!,
          createdAt: commentMap.get(r.targetId)!.createdAt.toISOString(),
        }
      : null,
  }));

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Admin Reports</h1>
          </div>
          <Link
            href="/home"
            className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Back
          </Link>
        </div>

        <AdminReportsClient initial={initial as any} />
      </div>
    </main>
  );
}
