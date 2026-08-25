import RootPageClient from "./RootPageClient";
import PrivateLandingNotice from "./components/PrivateLandingNotice";

export default function RootPage() {
  if (process.env.PRIVATE_MODE === "true") {
    return <PrivateLandingNotice />;
  }
  return <RootPageClient />;
}
