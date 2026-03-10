import "server-only";

import { getSession } from "@/server/auth/session";
import { revalidatePublicWork } from "@/server/cache/publicContent";
import { apiRoute, json } from "@/server/http";
import { enforceRateLimitOrResponse } from "@/server/rate-limit/response";
import { createStudioWork, listStudioWorks } from "@/server/services/studio/works";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  const data = await listStudioWorks(req);
  return json(data);
});

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });
  const limited = await enforceRateLimitOrResponse({ req, policyName: "studio.work.create", userId: session.user.id });
  if (limited) return limited;

  const res = await createStudioWork(req);
  const slug = (res.body as any)?.work?.slug as string | undefined;
  if (res.status >= 200 && res.status < 300) revalidatePublicWork(slug);
  return json(res.body, { status: res.status });
});
