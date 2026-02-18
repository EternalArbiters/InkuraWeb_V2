import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  const role = (session.user as any).role as string | undefined;
  if (role !== "ADMIN") {
    redirect("/home");
  }

  return <>{children}</>;
}
