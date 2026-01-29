'use client';

import Image from 'next/image';
import { useKeenSlider } from 'keen-slider/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHome, FaHistory, FaSearch, FaSlidersH } from 'react-icons/fa';

const banners = [
  {
    id: 1,
    title: 'Crimson Winter',
    description: 'A frostbound graphic novel by Luna Aoki.',
    image: '/images/hero-1.png',
    link: '/content/1',
  },
  {
    id: 2,
    title: 'Starfall Requiem',
    description: 'An interstellar drama between memory and fate.',
    image: '/images/hero-2.png',
    link: '/content/2',
  },
  {
    id: 3,
    title: 'Midnight Sonata',
    description: 'Romance and revenge intertwine in a haunting supernatural tale.',
    image: '/images/hero-3.png',
    link: '/content/3',
  },
];

const history = [
  {
    id: 1,
    title: 'Crimson Winter',
    image: '/images/comic1.png',
    type: 'Comic',
    countryCode: 'jp',
  },
  {
    id: 2,
    title: 'The Moonlight Pact',
    image: '/images/novel1.png',
    type: 'Novel',
    countryCode: 'kr',
  },
  {
    id: 3,
    title: 'Blazing Truth',
    image: '/images/drama1.png',
    type: 'Drama',
    countryCode: 'cn',
  },
  {
    id: 4,
    title: 'Ghost Flower',
    image: '/images/comic2.png',
    type: 'Comic',
    countryCode: 'th',
  },
  {
    id: 5,
    title: 'Sunset Letter',
    image: '/images/novel2.png',
    type: 'Novel',
    countryCode: 'vn',
  },
  {
    id: 6,
    title: 'Heir of Ashes',
    image: '/images/drama2.png',
    type: 'Drama',
    countryCode: 'id',
  },
  {
    id: 7,
    title: 'Velvet Season',
    image: '/images/comic3.png',
    type: 'Comic',
    countryCode: 'jp',
  },
  {
    id: 8,
    title: 'Tears of Sand',
    image: '/images/novel3.png',
    type: 'Novel',
    countryCode: 'kr',
  },
  {
    id: 9,
    title: 'Bamboo Cry',
    image: '/images/drama3.png',
    type: 'Drama',
    countryCode: 'cn',
  },
];

export default function HeroSpotlight() {
  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');
  const [currentSlide, setCurrentSlide] = useState(0);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: { perView: 1 },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
  });

  useEffect(() => {
    const interval = setInterval(() => {
      instanceRef.current?.next();
    }, 5000);
    return () => clearInterval(interval);
  }, [instanceRef]);

  return (
    <>
      
      <div className="relative h-[90vh]">
        <div ref={sliderRef} className="keen-slider h-full">
          {banners.map((item) => (
            <div key={item.id} className="keen-slider__slide relative h-full">
              <Image
                src={item.image}
                alt={item.title}
                fill
                priority
                className="object-cover brightness-[0.5]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent z-10" />

              <div className="relative z-20 h-full flex items-center px-6 md:px-16 max-w-5xl text-white">
                <div className="space-y-5">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                    {item.title}
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg text-white/80">
                    {item.description}
                  </p>
                  <div className="flex gap-4">
                    <Link
                      href={item.link}
                      className="px-6 py-3 bg-pink-600 hover:bg-pink-700 rounded-full font-semibold transition"
                    >
                      Read Now
                    </Link>
                    <button className="px-6 py-3 rounded-full border border-white/30 hover:bg-white hover:text-black transition">
                      + Add to Library
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {banners.map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-white' : 'bg-white/30'
                }`}
            />
          ))}
        </div>
      </div><br /><br />

      <div className="px-4 pt-6 pb-12 transition-colors duration-300">
        {/* Tab Buttons Responsive */}
        <div className="mb-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 min-w-max justify-start sm:justify-center">
            {[
              { key: 'home', icon: <FaHome />, label: 'Home' },
              { key: 'history', icon: <FaHistory />, label: 'History' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'home' | 'history')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition whitespace-nowrap ${activeTab === tab.key
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:text-pink-500'
                  }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}

            <Link
              href="/search"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-pink-500 transition whitespace-nowrap"
            >
              <FaSearch /> Search
            </Link>
            <Link
              href="/filter"
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-pink-500 transition whitespace-nowrap"
            >
              <FaSlidersH /> Filter
            </Link>
          </div>
        </div><br />

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Based on your interest:
              </p>
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                Top personalized content coming soon...
              </p>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Recently viewed:
              </p>

              {/* Horizontal Scrollable Cards */}
              <div className="overflow-x-auto no-scrollbar">
                <div className="flex gap-4 w-fit">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="w-[130px] shrink-0 bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-white/10 hover:shadow-md transition"
                    >
                      {/* Cover */}
                      <div className="relative h-[180px] w-full bg-white/10 dark:bg-white/5">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover rounded-t-xl"
                        />

                        {/* Label Tipe */}
                        {item.type && (
                          <div className="absolute top-1 left-1 bg-pink-500 text-white px-1.5 py-0.5 text-[10px] rounded z-10">
                            {item.type}
                          </div>
                        )}

                        {/* Bendera Negara */}
                        {item.countryCode && (
                          <div className="absolute top-1 right-1 w-4 h-2.5 z-10">
                            <Image
                              src={`/images/flags/${item.countryCode}.png`}
                              alt={item.countryCode}
                              fill
                              className="object-cover rounded-sm border border-white/40"
                            />
                          </div>
                        )}

                        {/* Link Navigasi */}
                        <Link
                          href={`/content/${item.id}`}
                          className="absolute inset-0 z-20"
                          aria-label={`Go to ${item.title}`}
                        />
                      </div>

                      {/* Judul */}
                      <div className="text-[12px] text-center text-gray-800 dark:text-white font-semibold p-1 truncate">
                        {item.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* See More */}
              <Link
                href="/history"
                className="inline-block mt-2 py-2 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full text-center transition"
              >
                See more
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
