import BackButton from "@/app/components/BackButton";
import PageScaffold from "../../components/PageScaffold";

export default async function ForumThreadPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;
  return (
    <PageScaffold
      title={` Forum: ${params.slug}`}
      description="Forum thread placeholder so /forum/* links do not 404."
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Future: post list, comments, upvotes, pins, and moderation.
        </p>
        <BackButton href="/community" />
      </div>
    </PageScaffold>
  );
}
