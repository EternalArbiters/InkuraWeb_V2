'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface Creator {
  id: number;
  name: string;
  avatar: string;
  bio: string;
  works: number;
  profileUrl: string;
}

const featuredCreators: Creator[] = [
  {
    id: 1,
    name: 'Luna Aoki',
    avatar: '/images/avatar-1.webp',
    bio: 'Writer of introspective novels & magical realism.',
    works: 12,
    profileUrl: '/creator/luna-aoki',
  },
  {
    id: 2,
    name: 'Jin Park',
    avatar: '/images/avatar-2.webp',
    bio: 'Comic artist blending street culture & fantasy.',
    works: 8,
    profileUrl: '/creator/jin-park',
  },
  {
    id: 3,
    name: 'Aruna Lestari',
    avatar: '/images/avatar-3.jpeg',
    bio: 'Drama screenwriter capturing Southeast Asian life.',
    works: 5,
    profileUrl: '/creator/aruna-lestari',
  },
];

export default function CreatorSpotlight() {
  return (
    <section className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto mt-20">
      <motion.h2
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
         Featured Creators
      </motion.h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {featuredCreators.map((creator, index) => (
          <motion.div
            key={creator.id}
            className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col items-center text-center backdrop-blur-sm hover:bg-white/10 transition"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <div className="w-20 h-20 relative mb-4">
              <Image
                src={creator.avatar}
                alt={creator.name}
                fill
                className="object-cover rounded-full border-2 border-white/20"
              />
            </div>
            <h3 className="text-lg font-semibold text-white">{creator.name}</h3>
            <p className="text-sm text-gray-300 mb-2">{creator.bio}</p>
            <p className="text-xs text-gray-400 mb-4">{creator.works} works</p>
            <Link
              href={creator.profileUrl}
              className="px-4 py-2 rounded-full text-sm font-medium bg-pink-600 text-white hover:bg-pink-700 transition"
            >
              View Profile
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
