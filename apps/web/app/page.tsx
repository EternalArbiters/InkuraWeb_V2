"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LandingPage from "./components/LandingPage"; // pindahkan isi landing ke komponen terpisah agar rapi

export default function RootPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const next = params?.get("next") || "";

  useEffect(() => {
    if (status === "authenticated") {
      // If user came from a protected route redirect, continue there after login.
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

  return <LandingPage />;
}
