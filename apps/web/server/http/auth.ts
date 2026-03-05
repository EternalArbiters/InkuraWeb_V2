import "server-only";

import { getSession } from "@/server/auth/session";
import { ApiError } from "./route";

/**
 * Read current session and return userId (or null).
 * This is a *session-only* check (no DB lookup).
 */
export async function getSessionUserId(): Promise<string | null> {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  return userId || null;
}

/**
 * Require an authenticated session userId.
 * Throws ApiError(401) so it can be handled by `apiRoute`.
 */
export async function requireSessionUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) throw new ApiError(401, "Unauthorized");
  return userId;
}

/**
 * Require an admin session (role-based; email-gated admin is enforced at auth time).
 * Throws ApiError(403).
 */
export async function requireAdminSession(): Promise<{ userId: string }> {
  const session = await getSession();
  const userId = (session as any)?.user?.id as string | undefined;
  const role = (session as any)?.user?.role as string | undefined;
  if (!userId) throw new ApiError(401, "Unauthorized");
  if (role !== "ADMIN") throw new ApiError(403, "Forbidden");
  return { userId };
}
