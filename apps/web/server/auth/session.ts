import "server-only";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getSession() {
  return getServerSession(authOptions);
}
