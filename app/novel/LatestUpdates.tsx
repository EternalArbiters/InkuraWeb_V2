"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const updates = [
  {
    id: 201,
    title: "Rahasia Langit Ketujuh",
    chapter: "Chapter 17: Kilatan Masa Lalu",
    updatedAt: "1 jam lalu",
    slug: "rahasia-langit-ketujuh",
    cover: "/images/sample-novel.jpg",
  },
  {
    id: 202,
    title: "Pelukis Kenangan",
    chapter: "Chapter 9: Rona yang Hilang",
    updatedAt: "5 jam lalu",
    slug: "pelukis-kenangan",
    cover: "/images/sample-novel.jpg",
  },
  {
    id: 203,
    title: "Penjaga Dimensi",
    chapter: "Chapter 21: Retakan Realita",
    updatedAt: "Kemarin",
    slug: "penjaga-dimensi",
    cover: "/images/sample-novel.jpg",
  },
];

export default function LatestUpdates() {
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold mb-4">🆕 Update Terbaru</h2>

      <div className="space-y-4">
        {updates.map((novel, i) => (
          <motion.div
            key={novel.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-white/5 border border-white/10 shadow-sm hover:shadow-md transition"
          >
            {/* Cover */}
            <div className="relative w-14 h-20 flex-shrink-0">
              <Image
                src={novel.cover}
                alt={novel.title}
                fill
                className="object-cover rounded-md"
              />
            </div>

            {/* Info */}
            <div className="flex-grow">
              <h3 className="text-sm font-bold text-black dark:text-white line-clamp-1">
                {novel.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">{novel.chapter}</p>
              <p className="text-xs text-gray-400">{novel.updatedAt}</p>
            </div>

            {/* Aksi */}
            <Link
              href={`/content/${novel.slug}`}
              className="text-pink-500 text-xs font-semibold hover:underline whitespace-nowrap"
            >
              Baca →
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
