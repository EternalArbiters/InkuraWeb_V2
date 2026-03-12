import BackButton from "@/app/components/BackButton";
import PageScaffold from "../../components/PageScaffold";

export default async function EventPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = await paramsPromise;
  return (
    <PageScaffold
      title={` Event: ${params.slug}`}
      description="Event page placeholder so /events/* links do not 404."
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Event", href: `/events/${params.slug}` },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6 space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Future: event details, rules, submissions, leaderboard, and discussion.
        </p>
        <BackButton href="/community" />
      </div>
    </PageScaffold>
  );
}
