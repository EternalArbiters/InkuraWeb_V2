"use client";

import { Star } from "lucide-react";

export default function Stars({ value }: { value: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((v) => {
        const active = value >= v;
        return (
          <Star
            key={v}
            size={16}
            className={
              active
                ? "text-yellow-600 dark:text-yellow-300 fill-current"
                : "text-gray-400 dark:text-gray-600"
            }
          />
        );
      })}
    </div>
  );
}
