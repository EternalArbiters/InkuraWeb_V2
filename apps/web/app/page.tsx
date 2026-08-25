import RootPageClient from "./RootPageClient";
import PrivateLandingNotice from "./components/PrivateLandingNotice";

// v30: force this to be evaluated per-request, not statically prerendered at build
// time — otherwise a PRIVATE_MODE env var set AFTER the last build wouldn't take
// effect until the next redeploy, which is exactly the kind of stale-static footgun
// this route shouldn't have.
export const dynamic = "force-dynamic";

export default function RootPage() {
  if (process.env.PRIVATE_MODE === "true") {
    return <PrivateLandingNotice />;
  }
  return <RootPageClient />;
}
