import Link from "next/link";
import PageScaffold from "../components/PageScaffold";

export default function CommunityPage() {
  return (
    <PageScaffold
      title="Community"
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Community", href: "/community" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Community Function Not Added Yet.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/forum/underrated-novels"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110"
          >
            Open the Demo Forum
          </Link>
          <Link
            href="/events/sketch-battle"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Open the Demo Event
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
