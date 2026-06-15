import { redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import prisma from "@/server/db/prisma";
import DonationsHistoryClient from "./DonationsHistoryClient";
import ListSurface from "@/app/components/ListSurface";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function serializeDonation(d: any) {
  return {
    ...d,
    createdAt: d.createdAt instanceof Date ? d.createdAt.toISOString() : d.createdAt,
    forwardedAt: d.forwardedAt instanceof Date ? d.forwardedAt.toISOString() : d.forwardedAt ?? null,
  };
}

export default async function DonationsPage() {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) redirect("/auth/signin?callbackUrl=/donations");

  const [sent, sentTotal, received, receivedTotal, tTitle, tSubtitle] = await Promise.all([
    prisma.creatorDonation.findMany({
      where: { donorUserId: userId },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        donorName: true,
        amount: true,
        currency: true,
        message: true,
        status: true,
        adminNote: true,
        forwardedAt: true,
        createdAt: true,
        recipientUser: { select: { id: true, username: true, name: true } },
      },
    }),
    prisma.creatorDonation.count({ where: { donorUserId: userId } }),
    prisma.creatorDonation.findMany({
      where: { recipientUserId: userId },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      select: {
        id: true,
        donorName: true,
        amount: true,
        currency: true,
        message: true,
        status: true,
        adminNote: true,
        forwardedAt: true,
        createdAt: true,
        donorUser: { select: { id: true, username: true, name: true } },
      },
    }),
    prisma.creatorDonation.count({ where: { recipientUserId: userId } }),
    getActiveUILanguageText("My Donations"),
    getActiveUILanguageText("Track donations you've sent and donations received as a creator."),
  ]);

  return (
    <ListSurface>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{tTitle}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{tSubtitle}</p>

        <DonationsHistoryClient
          initialSent={sent.map(serializeDonation) as any}
          sentTotal={sentTotal}
          sentTotalPages={Math.ceil(sentTotal / PAGE_SIZE)}
          initialReceived={received.map(serializeDonation) as any}
          receivedTotal={receivedTotal}
          receivedTotalPages={Math.ceil(receivedTotal / PAGE_SIZE)}
        />
      </div>
    </ListSurface>
  );
}
