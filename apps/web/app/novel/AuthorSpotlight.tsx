"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const authors = [
  {
    id: 1,
    name: "Raina Elvira",
    avatar: "/images/author-raina.jpg",
    bio: "Penulis novel romansa dan slice of life. Karyanya selalu bikin baper!",
    totalWorks: 12,
    slug: "raina-elvira",
  },
  {
    id: 2,
    name: "Nakamura Kaito",
    avatar: "/images/author-kaito.jpg",
    bio: "Ahli dunia fantasi dan petualangan. Tulisannya selalu penuh kejutan.",
    totalWorks: 9,
    slug: "nakamura-kaito",
  },
  {
    id: 3,
    name: "Sarasvati Arta",
    avatar: "/images/author-saras.jpg",
    bio: "Penyair digital dan penulis kisah psikologis yang menghantui hati.",
    totalWorks: 7,
    slug: "sarasvati-arta",
  },
];

export default function AuthorSpotlight() {
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold mb-4"> Kreator Pilihan</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {authors.map((author, i) => (
          <motion.div
            key={author.id}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            viewport={{ once: true }}
            className="rounded-xl p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center gap-4 mb-3">
              <Image
                src={author.avatar}
                alt={author.name}
                width={48}
                height={48}
                className="rounded-full border border-white/30 object-cover"
              />
              <div>
                <h3 className="text-sm font-semibold text-black dark:text-white">{author.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {author.totalWorks} karya
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{author.bio}</p>
            <Link
              href={`/creator/${author.slug}`}
              className="inline-block mt-3 text-pink-500 text-xs font-medium hover:underline"
            >
              Lihat Profil →
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
