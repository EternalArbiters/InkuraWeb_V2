'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { FiBookOpen, FiFilm, FiFeather } from 'react-icons/fi';

interface Genre {
  name: string;
  slug: string;
  icon: React.ReactNode;
  color: string;
}

const genres: Genre[] = [
  {
    name: 'Comics',
    slug: 'comic',
    icon: <FiBookOpen size={28} />,
    color: 'from-pink-500 to-pink-700',
  },
  {
    name: 'Novels',
    slug: 'novel',
    icon: <FiFeather size={28} />,
    color: 'from-indigo-500 to-indigo-700',
  },
  {
    name: 'Dramas',
    slug: 'drama',
    icon: <FiFilm size={28} />,
    color: 'from-green-500 to-green-700',
  },
  // Tambahkan genre tambahan di sini jika ada
];

export default function GenreBrowseSection() {
  return (
    <section className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto mt-16">
      <motion.h2
        className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 text-white"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
       Explore by Genre
      </motion.h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {genres.map((genre, index) => (
          <motion.div
            key={genre.slug}
            className="group relative"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <Link href={`/genre/${genre.slug}`}>
              <div
                className={`rounded-xl p-6 flex flex-col items-center justify-center text-white text-center h-40 bg-gradient-to-br ${genre.color} hover:brightness-110 transition`}
              >
                <div className="mb-3">{genre.icon}</div>
                <p className="text-lg font-semibold">{genre.name}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
