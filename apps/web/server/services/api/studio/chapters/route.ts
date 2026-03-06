import "server-only";

import { json } from "@/server/http";
import { createStudioChapter } from "@/server/services/studio/chapters";


export const POST = async (req: Request) => {
  const res = await createStudioChapter(req);
  return json(res.body, { status: res.status });
};
