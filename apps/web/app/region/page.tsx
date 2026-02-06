import Link from "next/link";
import PageScaffold from "../components/PageScaffold";

export default function RegionPage() {
  return (
    <PageScaffold
      title="Region"
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Region", href: "/region" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <ul className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          {[
            "Indonesia",
            "Japan",
            "Korea",
            "China",
            "Thailand",
            "Vietnam",
            "US",
            "Global",
          ].map((r) => (
            <li
              key={r}
              className="rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {r}
            </li>
          ))}
        </ul>

        <div className="mt-6">
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
