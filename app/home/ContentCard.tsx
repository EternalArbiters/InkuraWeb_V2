'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { ContentType } from './CategoryTabs';

export interface ContentItem {
  id: number;
  title: string;
  description: string;
  image: string;
  type: ContentType;
  countryCode: string; // e.g. 'jp', 'kr', 'cn'
  tags?: string[];
}

interface Props {
  item: ContentItem;
}

export default function ContentCard({ item }: Props) {
  const isPortrait = item.type === 'Comic' || item.type === 'Novel';
  const aspectClass = isPortrait ? 'aspect-[3/4]' : 'aspect-video';

  return (
    <motion.div
      className="relative w-[130px] sm:w-[140px] flex-shrink-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Cover */}
      <div
        className={clsx(
          'relative rounded-lg overflow-hidden shadow group transition-all duration-200 hover:shadow-lg hover:scale-[1.02] bg-white/5 dark:bg-white/10 backdrop-blur-sm border border-white/10',
          aspectClass
        )}
      >
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover transition group-hover:scale-105"
          sizes="(max-width: 768px) 40vw, 130px"
        />

        {/* Flag */}
        <div className="absolute bottom-1 right-1 w-4 h-3 z-10">
          <Image
            src={`/images/flags/${item.countryCode}.png`}
            alt={item.countryCode}
            fill
            className="rounded-sm border border-white/30 object-cover"
          />
        </div>
      </div>

      {/* Title */}
      <p className="mt-2 text-xs font-medium text-center text-gray-800 dark:text-gray-200 truncate">
        {item.title}
      </p>

      {/* Clickable area */}
      <Link
        href={`/content/${item.id}`}
        className="absolute inset-0 z-10"
        aria-label={`Go to ${item.title}`}
      />
    </motion.div>
  );
}
