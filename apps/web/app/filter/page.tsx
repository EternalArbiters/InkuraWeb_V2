import Link from "next/link";
import PageScaffold from "../components/PageScaffold";

export default function FilterPage() {
  return (
    <PageScaffold
      title=" Filter"
      description="Filter sekarang ada di Search (MVP). Halaman ini disiapkan untuk filter advanced nanti."
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Filter", href: "/filter" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Untuk sekarang kamu bisa filter type + sort + keyword di halaman Search.
          Ke depan bisa ditambah: genre, region, tag, status, min rating, dll.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110"
          >
            Lanjut ke Search
          </Link>
          <Link
            href="/all"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Return to All
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
