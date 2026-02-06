import Link from "next/link";
import PageScaffold from "../components/PageScaffold";

export default function CommunityPage() {
  return (
    <PageScaffold
      title="Community"
      description="Forum, event, dan community pulse."
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Community", href: "/community" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Link demo di Home seperti <b>/creator/*</b>, <b>/forum/*</b>, dan <b>/events/*</b> sekarang sudah ada placeholder-nya juga.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/forum/underrated-novels"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110"
          >
            Buka Forum Demo
          </Link>
          <Link
            href="/events/sketch-battle"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Buka Event Demo
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
