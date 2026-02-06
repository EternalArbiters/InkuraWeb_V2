"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiBookOpen } from "react-icons/fi";

const genres = [
  { name: "Romance", slug: "romance", color: "from-pink-400 to-pink-600" },
  { name: "Fantasy", slug: "fantasy", color: "from-purple-400 to-purple-600" },
  { name: "Mystery", slug: "mystery", color: "from-indigo-400 to-indigo-600" },
  { name: "Slice of Life", slug: "slice-of-life", color: "from-green-400 to-green-600" },
  { name: "Horror", slug: "horror", color: "from-red-400 to-red-600" },
  { name: "Historical", slug: "historical", color: "from-yellow-400 to-yellow-600" },
];

export default function GenreScroller() {
  return (
    <section>
      <motion.h2
        className="text-xl md:text-2xl font-bold mb-4"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true }}
      >
         Eksplorasi Berdasarkan Genre
      </motion.h2>

      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {genres.map((genre, i) => (
          <motion.div
            key={genre.slug}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            viewport={{ once: true }}
          >
            <Link
              href={`/genre/${genre.slug}`}
              className={`min-w-[140px] px-4 py-3 rounded-xl text-center text-sm font-semibold text-white bg-gradient-to-br ${genre.color} hover:brightness-110 transition shadow`}
            >
              <div className="flex items-center justify-center mb-1">
                <FiBookOpen size={20} />
              </div>
              {genre.name}
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
