import "server-only";
import { createReorderHandler } from "../../_factory";
import { config } from "../_config";

export const runtime = "nodejs";
export const { POST } = createReorderHandler(config);
