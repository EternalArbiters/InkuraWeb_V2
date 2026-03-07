import "server-only";

import { cache } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/server/auth/options";

export const getSession = cache(async () => getServerSession(authOptions));
