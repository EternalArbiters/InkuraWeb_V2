import "server-only";

import { json } from "@/server/http";
import {
  deleteStudioWorkById,
  getStudioWorkById,
  patchStudioWorkById,
} from "@/server/services/studio/workById";


export const GET = async (_req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const data = await getStudioWorkById(workId);
  return json(data);
};
export const PATCH = async (req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const res = await patchStudioWorkById(req, workId);
  return json(res.body, { status: res.status });
};
export const DELETE = async (_req: Request, { params }: { params: Promise<{ workId: string }> }) => {
  const { workId } = await params;
  const data = await deleteStudioWorkById(workId);
  return json(data);
};
