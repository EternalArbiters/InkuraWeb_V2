import "server-only";

import { redirect } from "next/navigation";
import { getSessionUserId } from "@/server/http/auth";

export async function requirePageUserId(callbackPath: string) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }
  return userId;
}
