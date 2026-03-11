import "server-only";

import prisma from "@/server/db/prisma";
import { getSession } from "@/server/auth/session";
import { apiRoute, json } from "@/server/http";
import { getViewerProfile } from "@/server/services/profile/viewerProfile";
import { revalidatePublicProfile } from "@/server/cache/publicContent";
import {
  hasCompleteDemographics,
  normalizeBirthMonth,
  normalizeBirthYear,
  normalizeGender,
} from "@/server/services/profile/demographics";
import { trackAnalyticsEventSafe } from "@/server/analytics/track";

export const runtime = "nodejs";

function normalizeUsername(raw: unknown) {
  return String(raw ?? "").trim().toLowerCase();
}

function isValidUsername(v: string) {
  return /^[a-z0-9][a-z0-9-_]{2,23}$/.test(v);
}

function normalizeName(raw: unknown) {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  return v.slice(0, 60);
}

function normalizeBio(raw: unknown) {
  const v = String(raw ?? "").replace(/\r\n/g, "\n").trim();
  if (!v) return null;
  return v.slice(0, 200);
}

function normalizeImage(raw: unknown) {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  const ok = /^https?:\/\//i.test(v) || v.startsWith("/");
  if (!ok) return null;
  return v.slice(0, 500);
}

export const GET = apiRoute(async () => {
  const data = await getViewerProfile();
  return json(data);
});

export const PATCH = apiRoute(async (req: Request) => {
  const session = await getSession();
  if (!session?.user?.id) return json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as any));
  const data: any = {};

  if ("name" in body) {
    data.name = normalizeName(body.name);
  }

  if ("bio" in body) {
    data.bio = normalizeBio(body.bio);
  }

  if ("image" in body) {
    const img = normalizeImage(body.image);
    if (img !== null) data.image = img;
  }

  if ("avatarFocusX" in body) {
    const v = Number(body.avatarFocusX);
    if (Number.isFinite(v)) data.avatarFocusX = Math.max(0, Math.min(100, Math.round(v)));
  }
  if ("avatarFocusY" in body) {
    const v = Number(body.avatarFocusY);
    if (Number.isFinite(v)) data.avatarFocusY = Math.max(0, Math.min(100, Math.round(v)));
  }
  if ("avatarZoom" in body) {
    const v = Number(body.avatarZoom);
    if (Number.isFinite(v)) data.avatarZoom = Math.max(1, Math.min(6, v));
  }

  if ("gender" in body) {
    const gender = normalizeGender(body.gender);
    if (gender !== undefined) data.gender = gender;
  }
  if ("birthMonth" in body) {
    const birthMonth = normalizeBirthMonth(body.birthMonth);
    if (birthMonth !== undefined) data.birthMonth = birthMonth;
  }
  if ("birthYear" in body) {
    const birthYear = normalizeBirthYear(body.birthYear);
    if (birthYear !== undefined) data.birthYear = birthYear;
  }

  if ("username" in body) {
    const next = normalizeUsername(body.username);
    if (!next) return json({ error: "Username is required" }, { status: 400 });
    if (!isValidUsername(next)) {
      return json(
        {
          error:
            "Invalid username. Use 3–24 chars: letters/numbers, dash (-) or underscore (_). Must start with a letter/number.",
        },
        { status: 400 }
      );
    }

    const clash = await prisma.user.findFirst({
      where: { username: next, NOT: { id: session.user.id } },
      select: { id: true },
    });
    if (clash) return json({ error: "Username already in use" }, { status: 409 });

    data.username = next;
  }

  if (!Object.keys(data).length) {
    return json({ ok: true, unchanged: true });
  }

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        username: true,
        gender: true,
        birthMonth: true,
        birthYear: true,
        analyticsOnboardingCompletedAt: true,
      },
    });

    const completedBefore = hasCompleteDemographics({
      gender: currentUser?.gender ?? null,
      birthMonth: currentUser?.birthMonth ?? null,
      birthYear: currentUser?.birthYear ?? null,
    });

    const nextGender = "gender" in data ? data.gender : currentUser?.gender ?? null;
    const nextBirthMonth = "birthMonth" in data ? data.birthMonth : currentUser?.birthMonth ?? null;
    const nextBirthYear = "birthYear" in data ? data.birthYear : currentUser?.birthYear ?? null;
    const completedAfter = hasCompleteDemographics({
      gender: nextGender,
      birthMonth: nextBirthMonth,
      birthYear: nextBirthYear,
    });

    if ("gender" in data || "birthMonth" in data || "birthYear" in data) {
      data.demographicsUpdatedAt = new Date();
      if (completedAfter && !currentUser?.analyticsOnboardingCompletedAt) {
        data.analyticsOnboardingCompletedAt = new Date();
      }
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        bio: true,
        image: true,
        avatarFocusX: true,
        avatarFocusY: true,
        avatarZoom: true,
        role: true,
        gender: true,
        birthMonth: true,
        birthYear: true,
        analyticsOnboardingCompletedAt: true,
      },
    });
    revalidatePublicProfile(currentUser?.username || updated.username);
    if (currentUser?.username && currentUser.username !== updated.username) {
      revalidatePublicProfile(updated.username);
    }

    if (!completedBefore && completedAfter) {
      await trackAnalyticsEventSafe({
        req,
        eventType: "PROFILE_ONBOARDING_COMPLETE",
        userId: session.user.id,
        path: "/api/me/profile",
        routeName: "me.profile.patch",
      });
    }

    return json({ ok: true, profile: updated });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg.includes("P2002") || msg.toLowerCase().includes("unique")) {
      return json({ error: "Username already in use" }, { status: 409 });
    }
    console.error("[api/me/profile] PATCH error", e);
    return json({ error: "Internal error" }, { status: 500 });
  }
});
