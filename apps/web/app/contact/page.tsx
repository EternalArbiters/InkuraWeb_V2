import Link from "next/link";
import PageScaffold from "../components/PageScaffold";

export default function ContactPage() {
  return (
    <PageScaffold
      title=" Contact"
      description="Placeholder halaman kontak."
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Contact", href: "/contact" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Coming soon. Untuk sekarang, bisa balik ke feed.
        </p>
        <div className="mt-4">
          <Link
            href="/all"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110"
          >
            Return to All
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
