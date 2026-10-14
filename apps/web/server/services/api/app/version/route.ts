import "server-only";

import { apiRoute, json } from "@/server/http";

export const runtime = "nodejs";

// v36: forced-update check for the Android shell. The installed APK's own
// versionCode never changes itself — it's static, baked in at build time — so the
// only way the app can know "a newer build exists" is to ask the server. The web
// client (ForceUpdateGate.tsx) compares this against Capacitor App.getInfo()'s
// build number and blocks the UI with an undismissable overlay if it's behind.
//
// Deliberately env-var-driven, not DB-backed: bumped only when a new native APK
// (not a routine web deploy) ships, which is meant to be rare — a tiny admin UI
// for this would be more moving parts than the problem calls for. Bump
// APP_MIN_VERSION on Project 3 (matching the new APK's android/app/build.gradle
// versionCode) and set APP_DOWNLOAD_URL to wherever that APK is hosted, then
// redeploy — that's the whole release step.
export const GET = apiRoute(async () => {
  const minVersion = Number(process.env.APP_MIN_VERSION || 0) || 0;
  const downloadUrl = process.env.APP_DOWNLOAD_URL || "";

  return json(
    { minVersion, downloadUrl },
    {
      // Checked on every app launch and needs to propagate fast once an admin
      // bumps it, so cache briefly rather than not at all — not no-store, to
      // avoid hammering the function on a burst of launches, but short enough
      // that a version bump is live for everyone within a minute.
      headers: { "Cache-Control": "public, max-age=60" },
    },
  );
});
