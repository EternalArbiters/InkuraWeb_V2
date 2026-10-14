import { headers } from "next/headers";
import { redirect } from "next/navigation";
import RootPageClient from "./RootPageClient";
import PrivateLandingNotice from "./components/PrivateLandingNotice";
import { isInkuraAppUserAgent } from "@/lib/appMode";
import { getSession } from "@/server/auth/session";

// v30: force this to be evaluated per-request, not statically prerendered at build
// time — otherwise a PRIVATE_MODE env var set AFTER the last build wouldn't take
// effect until the next redeploy, which is exactly the kind of stale-static footgun
// this route shouldn't have.
export const dynamic = "force-dynamic";

export default async function RootPage() {
  if (process.env.PRIVATE_MODE === "true") {
    return <PrivateLandingNotice />;
  }

  // v35: the APK has no use for the public-web marketing landing page — anonymous
  // app visitors should land straight in the real, readable catalog instead.
  // Reading already works without an account everywhere (gating is per-piece-of-
  // content, not per-page); only write actions require a session, unchanged.
  //
  // Checked server-side (not a client useEffect) so there is no landing-page flash
  // before the jump. Scoped to (app traffic) AND (no session) only: signed-in app
  // visits are untouched and still flow through RootPageClient below exactly as
  // today, which already sends them to /home or /onboarding correctly. Web visitors
  // on any deployment are completely unaffected either way.
  const h = await headers();
  if (isInkuraAppUserAgent(h.get("user-agent"))) {
    const session = await getSession();
    if (!session?.user) {
      redirect("/home");
    }
  }

  return <RootPageClient />;
}
