import "server-only";

import { apiRoute, json } from "@/server/http";
import { revalidatePublicWork } from "@/server/cache/publicContent";
import { createStudioWork, listStudioWorks } from "@/server/services/studio/works";

export const runtime = "nodejs";

export const GET = apiRoute(async (req: Request) => {
  const data = await listStudioWorks(req);
  return json(data);
});

export const POST = apiRoute(async (req: Request) => {
  const res = await createStudioWork(req);
  const slug = (res.body as any)?.work?.slug as string | undefined;
  if (res.status >= 200 && res.status < 300) revalidatePublicWork(slug);
  return json(res.body, { status: res.status });
});
