"use client";

import { useSession } from "next-auth/react";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LandingPage from "./components/LandingPage";

function RootPageInner() {
  const { status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get("next") || "";

  useEffect(() => {
    if (status === "authenticated") {
      if (next && next.startsWith("/")) {
        router.push(next);
      } else {
        router.push("/home");
      }
    }
  }, [status, router, next]);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return <LandingPage nextParam={next} />;
}

export default function RootPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <RootPageInner />
    </Suspense>
  );
}
