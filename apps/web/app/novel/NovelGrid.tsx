"use client";

import Image from "next/image";
import Link from "next/link";
import Badge from "./Badge"; 

const novels = [
  {
    id: 1,
    title: "Senja di Balik Jendela",
    slug: "senja-di-balik-jendela",
    author: "Alya Rizki",
    cover: "/images/sample-novel.jpg",
    genre: "Romance",
    status: "Ongoing",
    rating: 4.8,
  },
  {
    id: 2,
    title: "Legenda Pelindung Cahaya",
    slug: "legenda-pelindung-cahaya",
    author: "Akira Yamato",
    cover: "/images/sample-novel.jpg",
    genre: "Fantasy",
    status: "Complete",
    rating: 4.6,
  },
  // Tambahkan data lainnya
];

export default function NovelGrid() {
  return (
    <section>
      <h2 className="text-xl md:text-2xl font-bold mb-4"> Semua Novel</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {novels.map((novel) => (
          <Link
            key={novel.id}
            href={`/content/${novel.slug}`}
            className="group relative rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow hover:shadow-lg transition border border-gray-200 dark:border-white/10"
          >
            {/* Sampul */}
            <div className="relative w-full aspect-[3/4]">
              <Image
                src={novel.cover}
                alt={novel.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
              {/* Badge status */}
              <div className="absolute top-2 left-2 bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                {novel.status}
              </div>
              {/* Badge genre */}
              <div className="absolute top-2 right-2 bg-white/80 text-[10px] text-gray-800 dark:text-gray-700 px-2 py-0.5 rounded-full">
                {novel.genre}
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="text-sm font-semibold leading-tight line-clamp-2">
                {novel.title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                oleh {novel.author}
              </p>
              <p className="text-xs text-yellow-500 font-medium">
                ⭐ {novel.rating.toFixed(1)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
