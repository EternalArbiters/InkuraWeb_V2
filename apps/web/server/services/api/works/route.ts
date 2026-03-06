import "server-only";

import { json } from "@/server/http";
import { listPublishedWorks } from "@/server/services/works/listPublishedWorks";


export const GET = async (req: Request) => {
  const data = await listPublishedWorks(req);
  return json(data);
};
