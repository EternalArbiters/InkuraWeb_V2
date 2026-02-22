import { redirect } from "next/navigation";
import { requireAdmin } from "@/server/auth/requireUser";

export const runtime = "nodejs";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "UNAUTHORIZED") redirect("/auth/signin?callbackUrl=/admin");
    redirect("/home");
  }

  return <>{children}</>;
}
