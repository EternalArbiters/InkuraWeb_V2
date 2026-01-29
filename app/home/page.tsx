'use client';

import HeroSpotlight from './HeroSpotlight';
import PersonalizedSlider from './PersonalizedSlider';
import GenreBrowseSection from './GenreBrowseSection';
import TrendingSection from './TrendingSection';
import RecentUpdatesList from './RecentUpdatesList';
import CreatorSpotlight from './CreatorSpotlight';
import CommunityPulse from './CommunityPulse';
import CTAAppDownload from './CTAAppDownload';
import Footer from './Footer';
import { FaArrowUp, FaComments } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import SectionWrapper from '../components/SectionWrapper';
import Link from 'next/link';
import { BsHeartFill } from "react-icons/bs";


export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <main className="min-h-screen">
      {scrollY > 300 && (
        <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-4">
          {/* Scroll to Top Button – SELALU muncul */}
          <button
            id="scrollToTop"
            onClick={scrollToTop}
            className="p-4 md:p-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg hover:scale-110 transition"
            aria-label="Scroll to top"
          >
            <FaArrowUp size={18} className="md:size-5" />
          </button>

          
          <Link
            href="/chat"
            className="hidden md:flex p-4 md:p-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg hover:scale-110 transition items-center justify-center"
            aria-label="Chat Elya"
          >
            <img
              src="/images/chat-elie.png"
              alt="Elya Icon"
              className="w-4 h-4 md:w-5 md:h-5 object-contain scale-[1.2] md:scale-[1.8]"
            />
          </Link>
        </div>
      )}


      {/* Main Sections with Alternating Backgrounds */}
      <SectionWrapper index={0}>
        <HeroSpotlight />
      </SectionWrapper>

      <SectionWrapper index={1}>
        <PersonalizedSlider />
      </SectionWrapper>

      <SectionWrapper index={2}>
        <GenreBrowseSection />
      </SectionWrapper>

      <SectionWrapper index={3}>
        <TrendingSection />
      </SectionWrapper>

      <SectionWrapper index={4}>
        <RecentUpdatesList />
      </SectionWrapper>

      <SectionWrapper index={5}>
        <CreatorSpotlight />
      </SectionWrapper>

      <SectionWrapper index={6}>
        <CommunityPulse />
      </SectionWrapper>

      <SectionWrapper index={7}>
        <CTAAppDownload />
      </SectionWrapper>

      <Footer />
    </main>
  );
}
