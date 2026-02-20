import Link from "next/link";
import PageScaffold from "../components/PageScaffold";

export default function TranslatedPage() {
  return (
    <PageScaffold
      title="Translated"
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Translated", href: "/translated" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <div className="mt-6">
          <Link
            href="/search?type=translator&q="
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110"
          >
            Search Translator
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
