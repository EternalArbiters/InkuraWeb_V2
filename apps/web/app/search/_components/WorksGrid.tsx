import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import InteractiveWorkCard from "@/app/components/work/InteractiveWorkCard";

type Props = {
  works: any[];
  canViewMature: boolean;
  searchQuery?: string;
  searchType?: string;
};

export default async function WorksGrid({ works, canViewMature, searchQuery, searchType }: Props) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
      {works.map((w: any, index: number) => {
        const blur = w.isMature && !canViewMature;
        return (
          <InteractiveWorkCard
            key={w.id}
            work={w}
            blurImage={blur}
            analyticsClickEvent={searchQuery ? {
              eventType: "SEARCH_RESULT_CLICK",
              searchQuery,
              searchType: searchType || "works",
              workId: w.id,
              metadata: { position: index + 1 },
            } : null}
          />
        );
      })}

      {works.length === 0 ? (
        <div className="col-span-2 rounded-2xl border border-gray-200 bg-white/70 p-6 md:col-span-4 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="text-lg font-bold">{tNoResults}</div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{tTryAnother}</p>
        </div>
      ) : null}
    </div>
  );
}
