"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const featured = {
  id: 101,
  title: "Langit yang Terluka",
  author: "Raina Elvira",
  description: "Seorang gadis dengan luka masa lalu menemukan makna hidup di balik surat-surat dari orang asing.",
  cover: "/images/featured-novel.jpg", // Pastikan gambar tersedia
  slug: "langit-yang-terluka"
};

export default function FeaturedNovel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-white/10 flex flex-col md:flex-row"
    >
      {/* Cover */}
      <div className="relative w-full md:w-1/3 aspect-[3/4] md:aspect-auto">
        <Image
          src={featured.cover}
          alt={featured.title}
          fill
          className="object-cover rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center px-6 py-6 md:py-0 space-y-2 md:w-2/3">
        <h2 className="text-2xl font-bold">{featured.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">oleh <span className="font-medium">{featured.author}</span></p>
        <p className="text-sm text-gray-700 dark:text-gray-300">{featured.description}</p>
        <div className="mt-4">
          <Link
            href={`/content/${featured.slug}`}
            className="inline-block px-6 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-105 transition"
          >
            Baca Sekarang
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
