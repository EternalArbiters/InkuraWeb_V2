'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface UpdateItem {
  id: number;
  title: string;
  image: string;
  latestChapter: string;
  updatedAt: string; // Format: "2 hours ago", "Yesterday", etc.
  type: 'Comic' | 'Novel' | 'Drama';
}

const recentUpdates: UpdateItem[] = [
  {
    id: 201,
    title: 'The Forgotten Path',
    image: '/images/novel7.png',
    latestChapter: 'Chapter 14: Echoes of Truth',
    updatedAt: '2 hours ago',
    type: 'Novel',
  },
  {
    id: 202,
    title: 'Dragonbone Alley',
    image: '/images/comic7.png',
    latestChapter: 'Ep. 9: Crimson Gate',
    updatedAt: '5 hours ago',
    type: 'Comic',
  },
  {
    id: 203,
    title: 'Lanterns in Seoul',
    image: '/images/drama7.png',
    latestChapter: 'Episode 3: Reunion',
    updatedAt: 'Yesterday',
    type: 'Drama',
  },
];

export default function RecentUpdatesList() {
  return (
    <section className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto mt-14">
      <motion.h2
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        Recently Updated
      </motion.h2>

      <div className="space-y-6">
        {recentUpdates.map((item) => (
          <motion.div
            key={item.id}
            className="flex items-center gap-4 bg-white/5 hover:bg-white/10 transition rounded-lg px-4 py-3 border border-white/10 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <div className="relative w-16 h-20 flex-shrink-0 rounded overflow-hidden">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover rounded"
              />
            </div>
            <div className="flex-grow">
              <p className="text-sm font-bold text-white">{item.title}</p>
              <p className="text-xs text-gray-300">{item.latestChapter}</p>
              <p className="text-xs text-gray-400">{item.updatedAt}</p>
            </div>
            <Link
              href={`/content/${item.id}`}
              className="text-pink-400 text-xs font-medium hover:underline"
            >
              Read →
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
