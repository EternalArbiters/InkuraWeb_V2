import "server-only";
import { createCollectionHandlers } from "../_factory";
import { config } from "./_config";

export const runtime = "nodejs";
export const { GET, POST } = createCollectionHandlers(config);
