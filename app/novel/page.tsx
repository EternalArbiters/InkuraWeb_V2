"use client";

import FeaturedNovel from "./FeaturedNovel";
import FilterBar from "./FilterBar";
import GenreScroller from "./GenreScroller";
import NovelGrid from "./NovelGrid";
import LatestUpdates from "./LatestUpdates";
import AuthorSpotlight from "./AuthorSpotlight";
import CTAWriteNovel from "./CTAWriteNovel";

export default function NovelPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#fdfbff] via-[#f8f5ff] to-[#f4faff] dark:from-[#0a0a1a] dark:via-[#151629] dark:to-[#1b1c34] text-black dark:text-white transition-colors duration-500">
      {/* Hero / Intro */}
      <section className="px-4 py-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">📚 Jelajahi Dunia Novel di Inkura</h1>
        <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Temukan kisah penuh imajinasi, romansa, petualangan, dan misteri — semuanya ditulis oleh manusia, bukan AI.
        </p>
      </section>

      {/* Filter Bar */}
      <section className="px-4 mb-6">
        <FilterBar />
      </section>

      {/* Featured Novel */}
      <section className="px-4 mb-12">
        <FeaturedNovel />
      </section>

      {/* Genre Scroller */}
      <section className="px-4 mb-12">
        <GenreScroller />
      </section>

      {/* Grid of Novels */}
      <section className="px-4 mb-16">
        <NovelGrid />
      </section>

      {/* Latest Updates */}
      <section className="px-4 mb-16">
        <LatestUpdates />
      </section>

      {/* Author Spotlight */}
      <section className="px-4 mb-16">
        <AuthorSpotlight />
      </section>

      {/* CTA: Upload Novel */}
      <section className="px-4 mb-24">
        <CTAWriteNovel />
      </section>
    </main>
  );
}
