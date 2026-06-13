import "server-only";
import { createItemHandlers } from "../../_factory";
import { config } from "../_config";

export const runtime = "nodejs";
export const { PATCH, DELETE } = createItemHandlers(config);
