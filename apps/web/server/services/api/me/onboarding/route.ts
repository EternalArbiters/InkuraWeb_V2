import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import {
  hasCompletedProfileOnboarding,
  normalizeBirthMonth,
  normalizeBirthYear,
  normalizeGender,
} from "@/server/services/profile/demographics";
import { trackAnalyticsEventSafe } from "@/server/analytics/track";
import { normalizeInkuraLanguage } from "@/lib/inkuraLanguage";

export const runtime = "nodejs";

export const POST = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const gender = normalizeGender(body.gender);
  const birthMonth = normalizeBirthMonth(body.birthMonth);
  const birthYear = normalizeBirthYear(body.birthYear);
  const inkuraLanguage = normalizeInkuraLanguage(body.inkuraLanguage);

  if (!gender || !birthMonth || !birthYear || !inkuraLanguage) {
    return json({ error: "Gender, birth month, birth year, and Inkura language are required" }, { status: 400 });
  }

  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      analyticsOnboardingCompletedAt: true,
      gender: true,
      birthMonth: true,
      birthYear: true,
      inkuraLanguage: true,
    },
  });

  const completedBefore = hasCompletedProfileOnboarding({
    gender: current?.gender ?? null,
    birthMonth: current?.birthMonth ?? null,
    birthYear: current?.birthYear ?? null,
    inkuraLanguage: current?.inkuraLanguage ?? null,
  });

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      gender,
      birthMonth,
      birthYear,
      inkuraLanguage,
      demographicsUpdatedAt: new Date(),
      analyticsOnboardingCompletedAt: current?.analyticsOnboardingCompletedAt ?? new Date(),
    },
    select: {
      id: true,
      gender: true,
      birthMonth: true,
      birthYear: true,
      analyticsOnboardingCompletedAt: true,
      inkuraLanguage: true,
    },
  });

  if (!completedBefore) {
    await trackAnalyticsEventSafe({
      req,
      eventType: "PROFILE_ONBOARDING_COMPLETE",
      userId: session.user.id,
      path: "/api/me/onboarding",
      routeName: "me.onboarding.create",
    });
  }

  return json({ ok: true, profile: updated });
});
