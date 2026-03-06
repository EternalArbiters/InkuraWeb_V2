import Link from "next/link";

type Props = {
  hasActiveFilters: boolean;
};

export default function ActiveFiltersBar({ hasActiveFilters }: Props) {
  if (!hasActiveFilters) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
      <span className="text-gray-600 dark:text-gray-300">Active filters:</span>
      <Link href="/search" className="ml-auto text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
        Clear all
      </Link>
    </div>
  );
}
