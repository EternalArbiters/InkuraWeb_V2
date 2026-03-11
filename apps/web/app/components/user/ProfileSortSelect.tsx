"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type SortOption = {
  value: string;
  label: string;
};

export default function ProfileSortSelect({
  value,
  label,
  options,
}: {
  value: string;
  label: string;
  options: SortOption[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      value={value}
      onChange={(event) => {
        const next = new URLSearchParams(searchParams.toString());
        next.set("sort", event.target.value);
        const qs = next.toString();
        startTransition(() => {
          router.replace(qs ? `${pathname}?${qs}` : pathname);
        });
      }}
      disabled={isPending}
      className="rounded-full border border-gray-300 bg-white/80 px-3 py-2 text-sm font-semibold text-gray-800 outline-none hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white dark:hover:bg-gray-900"
      aria-label={label}
      title={label}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
