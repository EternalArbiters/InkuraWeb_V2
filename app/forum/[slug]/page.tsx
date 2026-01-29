import Link from "next/link";
import PageScaffold from "../../components/PageScaffold";

export default async function ForumThreadPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;
  return (
    <PageScaffold
      title={` Forum: ${params.slug}`}
      description="Thread forum (placeholder) supaya link /forum/* tidak 404."
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Forum", href: `/forum/${params.slug}` },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Nanti: post list, comment, upvote, pin, dan moderation.
        </p>
        <Link
          href="/community"
          className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110"
        >
          Kembali ke Community
        </Link>
      </div>
    </PageScaffold>
  );
}
