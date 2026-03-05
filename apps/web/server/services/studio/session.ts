import "server-only";

import { getSession } from "@/server/auth/session";
import { ApiError } from "@/server/http";
import { getCreatorRole } from "./creator";

export async function requireCreatorSession() {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const me = await getCreatorRole(userId);
  if (!me) throw new ApiError(401, "Unauthorized");

  return { session, userId, role: me.role };
}
