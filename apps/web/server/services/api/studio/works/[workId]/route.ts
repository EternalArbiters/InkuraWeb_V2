import "server-only";

import { apiRoute, json } from "@/server/http";
import { revalidatePublicWork } from "@/server/cache/publicContent";
import {
  deleteStudioWorkById,
  getStudioWorkById,
  patchStudioWorkById,
} from "@/server/services/studio/workById";

export const runtime = "nodejs";

export const GET = apiRoute(async (_req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const data = await getStudioWorkById(workId);
  return json(data);
});

export const PATCH = apiRoute(async (req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const res = await patchStudioWorkById(req, workId);
  const slug = (res.body as any)?.work?.slug as string | undefined;
  if (res.status >= 200 && res.status < 300) revalidatePublicWork(slug);
  return json(res.body, { status: res.status });
});

export const DELETE = apiRoute(async (_req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const data = await deleteStudioWorkById(workId);
  revalidatePublicWork((data as any)?.slug);
  return json(data);
});
