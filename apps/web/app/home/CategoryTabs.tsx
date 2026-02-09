'use client';

import { useState } from 'react';
import clsx from 'clsx';
import ContentCard, { ContentItem } from './ContentCard';

export type ContentType = 'Comic' | 'Novel' | 'Drama';

interface CategoryTabsProps {
  items: ContentItem[];
}

const categories: (ContentType | 'All')[] = ['All', 'Comic', 'Novel', 'Drama'];

export default function CategoryTabs({ items }: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState<ContentType | 'All'>('All');

  const filteredItems =
    activeCategory === 'All'
      ? items
      : items.filter((item) => item.type === activeCategory);

  return (
    <section className="px-4 pt-4 space-y-6">
      {/* Tab Buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition',
              activeCategory === cat
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Scrollable Cards */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-4 w-fit">
          {filteredItems.map((item) => (
            <ContentCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
