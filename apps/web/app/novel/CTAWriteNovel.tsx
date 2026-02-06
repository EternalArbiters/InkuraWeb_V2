"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FaFeatherAlt } from "react-icons/fa";

export default function CTAWriteNovel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-[#251f36] dark:via-[#2f2544] dark:to-[#2d2e45] rounded-xl px-6 py-8 shadow-lg text-center"
    >
      <div className="flex flex-col items-center justify-center space-y-3">
        <FaFeatherAlt size={32} className="text-pink-500 dark:text-pink-400" />
        <h2 className="text-xl md:text-2xl font-bold">Punya Cerita untuk Dibagikan?</h2>
        <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 max-w-xl">
          Inkura mendukung karya orisinalmu. Unggah novelmu dan jangkau pembaca dari seluruh Asia. Kami tidak melatih AI dari karyamu. Kamu aman di sini.
        </p>
        <Link
          href="/upload"
          className="inline-block mt-4 px-6 py-2 text-sm font-semibold rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-105 transition"
        >
           Mulai Tulis Novelmu
        </Link>
      </div>
    </motion.div>
  );
}
