import "server-only";
import { createSortHandler } from "../../_factory";
import { config, sortConfig } from "../_config";

export const runtime = "nodejs";
export const { POST } = createSortHandler(config, sortConfig);
