"use client";

import { useSearchParams } from "next/navigation";

import AuthModal from "@/hooks/AuthModal";
import { useAuthModal } from "@/hooks/useAuthModal";

import LandingFooter from "./landing/LandingFooter";
import LandingHeader from "./landing/LandingHeader";
import HeroSection from "./landing/HeroSection";
import FeaturedFeaturesSection from "./landing/FeaturedFeaturesSection";
import WhyInkuraSection from "./landing/WhyInkuraSection";
import DiscoverSection from "./landing/DiscoverSection";
import HowItWorksSection from "./landing/HowItWorksSection";
import JoinUsBanner from "./landing/JoinUsBanner";
import ScrollToTopButton from "./landing/ScrollToTopButton";
import { useLandingTheme } from "./landing/useLandingTheme";
import { DISCOVER_ITEMS, FEATURED_FEATURES, HOW_IT_WORKS_ITEMS, WHY_INKURA_ITEMS } from "./landing/data";

export default function LandingPage() {
  const { onOpen } = useAuthModal();
  const params = useSearchParams();
  const next = params?.get("next") || "";

  const { isDarkMode, toggleDarkMode } = useLandingTheme();

  const openLogin = (n?: string | null) => onOpen("login", n ?? null);
  const openSignup = (n?: string | null) => onOpen("signup", n ?? null);

  return (
    <main>
      <AuthModal />

      <LandingHeader
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        onLogin={() => openLogin(next || null)}
        onSignup={() => openSignup(next || null)}
      />

      <ScrollToTopButton />

      <HeroSection next={next} onLogin={openLogin} onSignup={openSignup} />

      <FeaturedFeaturesSection features={FEATURED_FEATURES} />
      <WhyInkuraSection items={WHY_INKURA_ITEMS} />
      <DiscoverSection items={DISCOVER_ITEMS} />
      <HowItWorksSection items={HOW_IT_WORKS_ITEMS} />

      <JoinUsBanner onJoin={() => openLogin(null)} />

      <LandingFooter />
    </main>
  );
}
