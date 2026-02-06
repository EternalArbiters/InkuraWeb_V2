import Link from "next/link";
import PageScaffold from "../components/PageScaffold";

export default function FilmPage() {
  return (
    <PageScaffold
      title="Film"
      description="Sorry, the movie feature hasn't been added at this time. You'll be notified once it's added."
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Film", href: "/film" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Sorry, the movie feature hasn't been added at this time. You'll be notified once it's added.
        </p>
        <div className="mt-4">
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
