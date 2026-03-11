import Link from "next/link";

import ProfileReviewCard from "@/app/components/user/ProfileReviewCard";
import ProfileSortSelect from "@/app/components/user/ProfileSortSelect";
import { requirePageUserId } from "@/server/auth/pageAuth";
import { getViewerReviews } from "@/server/services/profile/viewerActivity";
import LoadMoreList from "@/app/components/LoadMoreList";

export const dynamic = "force-dynamic";

const REVIEW_SORT_OPTIONS = [
  { value: "helpful", label: "Helpful" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
] as const;

export default async function ProfileReviewsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userId = await requirePageUserId("/profile/reviews");
  const resolvedSearchParams = (await searchParams) || {};
  const rawSort = Array.isArray(resolvedSearchParams.sort) ? resolvedSearchParams.sort[0] : resolvedSearchParams.sort;
  const { items, sort } = await getViewerReviews(userId, { sort: rawSort, take: 100 });

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/profile" className="text-sm font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              ← Back to profile
            </Link>
<h1 className="mt-3 text-3xl font-extrabold tracking-tight">All Reviews</h1>
          </div>
          <ProfileSortSelect value={sort} label="Sort reviews" options={[...REVIEW_SORT_OPTIONS]} />
        </div>

        {items.length ? (
          <LoadMoreList className="mt-6 grid gap-3">
            {items.map((review) => (
              <ProfileReviewCard key={review.id} review={review} />
            ))}
          </LoadMoreList>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
            No reviews yet.
          </div>
        )}
      </div>
    </main>
  );
}
