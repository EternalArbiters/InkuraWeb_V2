import ActionLink from "@/app/components/ActionLink";
import { listPublishedWorksFromSearchParams } from "@/server/services/works/listPublishedWorks";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import WorksGrid from "../components/WorksGrid";

export const dynamic = "force-dynamic";

export default async function AllWorksPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ sort?: string; publishType?: string; author?: string; translator?: string }>;
}) {
  const sp = await searchParamsPromise;

  const sort = (sp.sort || "newest").toLowerCase();
  const publishType = (sp.publishType || "").toUpperCase();
  const author = (sp.author || "").trim();
  const translator = (sp.translator || "").trim();

  const qs = new URLSearchParams();
  qs.set("take", "48");
  if (sort && sort !== "newest") qs.set("sort", sort);
  if (publishType === "ORIGINAL" || publishType === "TRANSLATION" || publishType === "REUPLOAD") qs.set("publishType", publishType);
  if (author) qs.set("author", author);
  if (translator) qs.set("translator", translator);

  let works: any[] = [];
  try {
    works = (await listPublishedWorksFromSearchParams(qs)).works;
  } catch {
    works = [];
  }

  const [title, advancedSearchLabel, newestLabel, likedLabel, ratedLabel, anyPublishTypeLabel, originalLabel, translationLabel, reuploadLabel, authorLabel, translatorLabel, applyLabel] = await Promise.all([
    getActiveUILanguageText("All Works", { section: "Page Browse Catalog" }),
    getActiveUILanguageText("Advanced search", { section: "Page Browse Catalog" }),
    getActiveUILanguageText("Newest", { section: "Page Browse Catalog" }),
    getActiveUILanguageText("Most liked", { section: "Page Browse Catalog" }),
    getActiveUILanguageText("Best rated", { section: "Page Browse Catalog" }),
    getActiveUILanguageText("Any publish type", { section: "Page Browse Catalog" }),
    getActiveUILanguageText("Original", { section: "Page Browse Catalog" }),
    getActiveUILanguageText("Translation", { section: "Page Browse Catalog" }),
    getActiveUILanguageText("Reupload", { section: "Page Browse Catalog" }),
    getActiveUILanguageText("Author (username / name)", { section: "Page Browse Catalog" }),
    getActiveUILanguageText("Translator (username / name)", { section: "Page Browse Catalog" }),
    getActiveUILanguageText("Apply", { section: "Page Browse Catalog" }),
  ]);

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
          </div>
          <ActionLink href="/search">{advancedSearchLabel}</ActionLink>
        </div>

        <form action="/all" method="get" className="mt-6 grid grid-cols-1 md:grid-cols-[160px_200px_1fr_1fr_140px] gap-3">
          <select name="sort" defaultValue={sort} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <option value="newest">{newestLabel}</option>
            <option value="liked">{likedLabel}</option>
            <option value="rated">{ratedLabel}</option>
          </select>

          <select name="publishType" defaultValue={publishType} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
            <option value="">{anyPublishTypeLabel}</option>
            <option value="ORIGINAL">{originalLabel}</option>
            <option value="TRANSLATION">{translationLabel}</option>
            <option value="REUPLOAD">{reuploadLabel}</option>
          </select>

          <input name="author" defaultValue={author} placeholder={authorLabel} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500" />
          <input name="translator" defaultValue={translator} placeholder={translatorLabel} className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500" />
          <button className="w-full py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110">{applyLabel}</button>
        </form>

        <div className="mt-8">
          <WorksGrid works={works as any} />
        </div>
      </div>
    </main>
  );
}
