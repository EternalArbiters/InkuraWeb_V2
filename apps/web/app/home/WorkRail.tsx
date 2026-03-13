import ActionLink from "@/app/components/ActionLink";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import HorizontalRail from "./HorizontalRail";
import WorkCardSquare from "./WorkCardSquare";

type Props = {
  title: string;
  href: string;
  works: any[];
  emptyText?: string;
};

export default async function WorkRail({ title, href, works, emptyText }: Props) {
  const [seeAllLabel, emptyLabel] = await Promise.all([
    getActiveUILanguageText("See all", { section: "Page Home" }),
    getActiveUILanguageText("No items.", { section: "Page Home" }),
  ]);

  return (
    <section>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg md:text-xl font-extrabold tracking-tight">{title}</h2>
        <ActionLink href={href}>{seeAllLabel}</ActionLink>
      </div>

      <div className="mt-3">
        {works?.length ? (
          <HorizontalRail>
            {works.map((w) => (
              <WorkCardSquare key={w.id} work={w} />
            ))}
          </HorizontalRail>
        ) : (
          <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 text-sm text-gray-600 dark:text-gray-300">
            {emptyText || emptyLabel}
          </div>
        )}
      </div>
    </section>
  );
}
