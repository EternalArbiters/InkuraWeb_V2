import InteractiveWorkCard from "@/app/components/work/InteractiveWorkCard";

type Props = {
  works: any[];
  canViewMature: boolean;
};

export default function WorksGrid({ works, canViewMature }: Props) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
      {works.map((w: any) => {
        const blur = w.isMature && !canViewMature;
        return <InteractiveWorkCard key={w.id} work={w} blurImage={blur} />;
      })}

      {works.length === 0 ? (
        <div className="col-span-2 rounded-2xl border border-gray-200 bg-white/70 p-6 md:col-span-4 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="text-lg font-bold">No results</div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Coba keyword lain atau ganti filter.</p>
        </div>
      ) : null}
    </div>
  );
}
