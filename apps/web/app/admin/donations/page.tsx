import Link from "next/link";
import BackButton from "@/app/components/BackButton";
import AdminDonationsClient from "./AdminDonationsClient";
import prisma from "@/server/db/prisma";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminDonationsPage() {
  let donations: any[] = [];
  let total = 0;

  try {
    const [rows, count] = await Promise.all([
      prisma.creatorDonation.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        select: {
          id: true,
          donorName: true,
          amount: true,
          currency: true,
          message: true,
          proofImageUrl: true,
          status: true,
          adminNote: true,
          forwardedAt: true,
          createdAt: true,
          donorUser: { select: { id: true, username: true, name: true } },
          recipientUser: { select: { id: true, username: true, name: true } },
        },
      }),
      prisma.creatorDonation.count({ where: { status: "PENDING" } }),
    ]);

    donations = rows.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
      forwardedAt: d.forwardedAt ? d.forwardedAt.toISOString() : null,
    }));
    total = count;
  } catch (err: any) {
    // Table likely doesn't exist yet — remind admin to run prisma db push
    return (
      <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-extrabold">Creator Donations</h1>
          <div className="mt-6 rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
            <p className="font-semibold text-red-700 dark:text-red-400">Database table not found.</p>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              Run <code className="font-mono bg-red-100 dark:bg-red-900/40 px-1 py-0.5 rounded">npx prisma db push</code> inside the <code className="font-mono bg-red-100 dark:bg-red-900/40 px-1 py-0.5 rounded">apps/web</code> directory, then refresh this page.
            </p>
            <p className="mt-2 text-xs text-red-500">{String(err?.message || err)}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Creator Donations</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Review and forward donations from readers to creators.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/reports"
              className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Reports
            </Link>
            <Link
              href="/admin/analytics"
              className="rounded-full px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Analytics
            </Link>
            <BackButton href="/admin/reports" />
          </div>
        </div>

        <AdminDonationsClient
          initial={donations}
          initialTotal={total}
          initialTotalPages={Math.ceil(total / PAGE_SIZE) || 1}
        />
      </div>
    </main>
  );
}
