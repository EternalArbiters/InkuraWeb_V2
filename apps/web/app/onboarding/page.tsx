import { redirect } from "next/navigation";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { getViewerProfile } from "@/server/services/profile/viewerProfile";
import { hasCompletedProfileOnboarding } from "@/server/services/profile/demographics";
import OnboardingForm from "./OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  await requirePageUserId("/onboarding");
  const { profile } = await getViewerProfile();

  if (hasCompletedProfileOnboarding(profile)) {
    redirect("/home");
  }

  return (
    <main className="min-h-screen bg-[#050b1c] px-4 py-8 text-white md:px-6 md:py-12">
      <div className="mx-auto max-w-4xl">
        <OnboardingForm
          initial={{
            gender: profile.gender,
            birthMonth: profile.birthMonth,
            birthYear: profile.birthYear,
            inkuraLanguage: profile.inkuraLanguage,
          }}
        />
      </div>
    </main>
  );
}
