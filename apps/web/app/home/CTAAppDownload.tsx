'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CTAAppDownload() {
  return (
    <section className="relative mt-32 px-4">
      <motion.div
        className="max-w-6xl mx-auto bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-12 rounded-3xl text-center shadow-xl relative overflow-hidden"
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="absolute -top-16 -left-16 w-96 h-96 bg-pink-400 opacity-20 rounded-full blur-[120px]" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-500 opacity-20 rounded-full blur-[120px]" />

        <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4 relative z-10">
          Take Inkura With You
        </h3>
        <p className="text-lg text-white/90 max-w-xl mx-auto mb-6 relative z-10">
          Download the app or join our newsletter for early access to new stories and community events.
        </p>

        <div className="flex justify-center gap-4 flex-wrap relative z-10">
          <Link href="/app-download" className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-full hover:bg-slate-100 transition">
             Download App
          </Link>
          <Link href="/newsletter" className="px-6 py-3 border border-white text-white font-semibold rounded-full hover:bg-white hover:text-purple-700 transition">
             Join Newsletter
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
