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
      inkuraLanguage?: "EN" | "ID" | null;
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
    inkuraLanguage?: "EN" | "ID" | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    avatarFocusX?: number | null;
    avatarFocusY?: number | null;
    avatarZoom?: number | null;
    profileOnboardingComplete?: boolean;
    analyticsOnboardingCompletedAt?: string | null;
    inkuraLanguage?: "EN" | "ID" | null;
  }
}
