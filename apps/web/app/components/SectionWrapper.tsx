'use client';

import React from 'react';
import clsx from 'clsx';

interface Props {
  index: number;
  children: React.ReactNode;
}

export default function SectionWrapper({ index, children }: Props) {
  const isEven = index % 2 === 0;

  return (
    <section
      className={clsx(
        'w-full py-16 transition-colors duration-500',
        isEven
          ? 'bg-white text-gray-900 dark:bg-gray-950 dark:text-white'
          : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
      )}
    >
      {children}
    </section>
  );
}
