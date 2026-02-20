import Link from "next/link";
import PageScaffold from "../components/PageScaffold";

export default function HistoryPage() {
  return (
    <PageScaffold
      title=" History"
      description="Link demo dari Home mengarah ke /history, jadi kita sediakan halaman ini supaya tidak 404."
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "History", href: "/history" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Versi final nanti akan jadi halaman history utama. Untuk sementara, history disimpan di route settings.
        </p>
        <div className="mt-4">
          <Link
            href="/settings/history"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110"
          >
            Open Reading History
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
