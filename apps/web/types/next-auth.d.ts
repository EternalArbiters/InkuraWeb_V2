import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: string;
      name?: string | null;
      image?: string | null;
      profileOnboardingComplete?: boolean;
      analyticsOnboardingCompletedAt?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    role: string;
    name?: string | null;
    image?: string | null;
    profileOnboardingComplete?: boolean;
    analyticsOnboardingCompletedAt?: string | null;
  }
}
