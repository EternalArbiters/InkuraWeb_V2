import Link from "next/link";
import PageScaffold from "../../components/PageScaffold";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ContentDetailPage({ params: paramsPromise }: Props) {
  const params = await paramsPromise;

  return (
    <PageScaffold
      title={` Content: ${params.slug}`}
      description="Detail karya (placeholder) supaya semua link /content/* tidak 404."
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Content", href: `/content/${params.slug}` },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Nanti di sini: cover, sinopsis, tags, tombol follow/bookmark, daftar chapter, dan stats.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/novel"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110"
          >
            Explore Novel
          </Link>
          <Link
            href="/comic"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Explore Comic
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
