'use client';

import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface TrendingItem {
  id: number;
  title: string;
  image: string;
  type: 'Comic' | 'Novel' | 'Drama';
  countryCode: string;
}

const trendingData: Record<string, TrendingItem[]> = {
  Comic: [
    { id: 1, title: 'Crimson Winter', image: '/images/comic1.png', type: 'Comic', countryCode: 'jp' },
    { id: 13, title: 'Ghost Script', image: '/images/comic5.png', type: 'Comic', countryCode: 'cn' },
    { id: 14, title: 'Painted Truths', image: '/images/comic6.png', type: 'Comic', countryCode: 'id' },
  ],
  Novel: [
    { id: 15, title: 'Letters to the Sun', image: '/images/novel5.png', type: 'Novel', countryCode: 'id' },
    { id: 16, title: 'Whispers of Rain', image: '/images/novel6.png', type: 'Novel', countryCode: 'ph' },
  ],
  Drama: [
    { id: 17, title: 'Seoul Mirage', image: '/images/drama5.png', type: 'Drama', countryCode: 'kr' },
    { id: 18, title: 'Ocean Eyes', image: '/images/drama6.png', type: 'Drama', countryCode: 'cn' },
  ],
};

export default function TrendingSection() {
  return (
    <section className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto mt-20 space-y-12">
      <motion.h2
        className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Trending Now by Category
      </motion.h2>

      {Object.entries(trendingData).map(([category, items], catIdx) => {
        const [sliderRef] = useKeenSlider<HTMLDivElement>({
          loop: false,
          slides: {
            perView: 2.2,
            spacing: 12,
          },
          breakpoints: {
            '(min-width: 640px)': {
              slides: { perView: 3.4, spacing: 16 },
            },
            '(min-width: 1024px)': {
              slides: { perView: 5, spacing: 18 },
            },
          },
        });

        return (
          <div key={category}>
            <motion.h3
              className="text-lg sm:text-xl md:text-2xl font-semibold mb-4 text-white"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * catIdx, duration: 0.5 }}
            >
              {category}
            </motion.h3>

            <div ref={sliderRef} className="keen-slider">
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  className="keen-slider__slide"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <div className="relative w-[120px] sm:w-[140px]">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden shadow-sm group border border-white/10 bg-white/5 dark:bg-white/10 backdrop-blur-sm hover:scale-105 transition-all">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                      {/* Flag */}
                      <div className="absolute top-1 right-1 w-4 h-3 z-10">
                        <Image
                          src={`/images/flags/${item.countryCode}.png`}
                          alt={item.countryCode}
                          fill
                          className="rounded-sm border border-white/30 object-cover"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-medium text-center text-gray-100 truncate">
                      {item.title}
                    </p>
                    <Link
                      href={`/content/${item.id}`}
                      className="absolute inset-0"
                      aria-label={`Go to ${item.title}`}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
