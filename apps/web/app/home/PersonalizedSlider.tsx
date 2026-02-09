'use client';

import { useKeenSlider } from 'keen-slider/react';
import 'keen-slider/keen-slider.min.css';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface WorkItem {
  id: number;
  title: string;
  image: string;
  type: 'Comic' | 'Novel' | 'Drama';
  countryCode?: string;
}

const sampleRecommendations: WorkItem[] = [
  {
    id: 10,
    title: 'Flower Moon Pact',
    image: '/images/comic4.png',
    type: 'Comic',
    countryCode: 'jp',
  },
  {
    id: 11,
    title: 'Falling Ink',
    image: '/images/novel4.png',
    type: 'Novel',
    countryCode: 'id',
  },
  {
    id: 12,
    title: 'Midnight Seoul',
    image: '/images/drama4.png',
    type: 'Drama',
    countryCode: 'kr',
  },
  {
    id: 13,
    title: 'Ghost Script',
    image: '/images/comic5.png',
    type: 'Comic',
    countryCode: 'cn',
  },
];

export default function PersonalizedSlider() {
  const [sliderRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
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
    <section className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.h2
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
       Recommended for You
      </motion.h2>

      <div ref={sliderRef} className="keen-slider">
        {sampleRecommendations.map((item, i) => (
          <motion.div
            key={item.id}
            className="keen-slider__slide"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <div className="w-[140px] sm:w-[160px] relative group mx-auto">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden border bg-white/10 dark:bg-white/5 border-white/10 hover:scale-105 transition-all duration-300 shadow-sm group">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Flag Country */}
                {item.countryCode && (
                  <div className="absolute top-1 right-1 w-5 h-3 z-10">
                    <Image
                      src={`/images/flags/${item.countryCode}.png`}
                      alt={item.countryCode}
                      fill
                      className="object-cover rounded-sm border border-white/40"
                    />
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs font-medium text-center text-gray-800 dark:text-white truncate">
                {item.title}
              </p>
              <Link
                href={`/content/${item.id}`}
                className="absolute inset-0 z-10"
                aria-label={`View ${item.title}`}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
