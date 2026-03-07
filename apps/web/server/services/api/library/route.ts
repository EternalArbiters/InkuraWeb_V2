import "server-only";

import { apiRoute, json } from "@/server/http";
import { getViewerLibrary } from "@/server/services/library/viewerLibrary";

export const runtime = "nodejs";

export const GET = apiRoute(async () => {
  const data = await getViewerLibrary();
  return json(data);
});
