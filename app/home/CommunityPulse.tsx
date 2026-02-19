'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

interface PulseItem {
  id: number;
  type: 'comment' | 'event' | 'thread' | 'shoutout';
  content: string;
  author: string;
  timestamp: string;
  link: string;
}

const communityData: PulseItem[] = [
  {
    id: 1,
    type: 'comment',
    content: '“Crimson Winter’s ending gave me chills… 😭🔥”',
    author: 'readsalot_22',
    timestamp: '2h ago',
    link: '/content/101#comments',
  },
  {
    id: 2,
    type: 'event',
    content: '🖌️ Live Sketch Battle — This Saturday at 7PM!',
    author: 'Inkura Events',
    timestamp: 'Upcoming',
    link: '/events/sketch-battle',
  },
  {
    id: 3,
    type: 'thread',
    content: 'Let’s discuss underrated webnovels — drop your gems 💎',
    author: 'bookworm_07',
    timestamp: '5h ago',
    link: '/forum/underrated-novels',
  },
  {
    id: 4,
    type: 'shoutout',
    content: '✨ Big congrats to @aruna_lestari for reaching 1K followers!',
    author: 'InkuraTeam',
    timestamp: 'Today',
    link: '/creator/aruna-lestari',
  },
];

export default function CommunityPulse() {
  return (
    <section className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto mt-20">
      <motion.h2
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        💬 Community Pulse
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
        {communityData.map((item, i) => (
          <motion.div
            key={item.id}
            className="bg-white/5 border border-white/10 rounded-lg p-4 backdrop-blur-sm hover:bg-white/10 transition"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <p className="text-sm text-gray-100 mb-2">“{item.content}”</p>
            <div className="text-xs text-gray-400 flex justify-between items-center">
              <span>by <strong>@{item.author}</strong></span>
              <span>{item.timestamp}</span>
            </div>
            <Link
              href={item.link}
              className="block mt-2 text-pink-400 text-sm hover:underline"
            >
              View →
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
