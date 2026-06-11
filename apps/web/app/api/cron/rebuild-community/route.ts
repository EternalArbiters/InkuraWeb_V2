export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { rebuildCommunitySnapshots } from "@/server/services/admin/community";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await rebuildCommunitySnapshots();
    return Response.json({ ok: true, ...result });
  } catch (err: any) {
    console.error("[cron:rebuild-community]", err);
    return Response.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
