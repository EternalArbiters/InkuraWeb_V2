import Link from "next/link";

type Props = {
  q: string;
  count: number;
};

export default function ResultsHeader({ q, count }: Props) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      <div className="text-sm text-gray-600 dark:text-gray-300">
        {q ? (
          <span>
            Hasil untuk <b>"{q}"</b> • {count} item
          </span>
        ) : (
          <span>{count} item</span>
        )}
      </div>
      <Link href="/all" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
        Explore
      </Link>
    </div>
  );
}
