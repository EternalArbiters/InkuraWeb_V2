import { listPublishedWorksFromSearchParams } from "@/server/services/works/listPublishedWorks";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import WorksGrid from "../components/WorksGrid";
import ListSurface from "../components/ListSurface";
import BrowsePageChrome from "@/app/browse/_components/BrowsePageChrome";
import BrowseCatalogFilter from "@/app/components/BrowseCatalogFilter";

export const dynamic = "force-dynamic";

export default async function ComicPage({
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
  qs.set("type", "COMIC");
  qs.set("ignoreLang", "1");
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
    getActiveUILanguageText("Comics", { section: "Page Browse Catalog" }),
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
    <ListSurface>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <BrowsePageChrome title={title} count={works.length} searchHref="/search?kind=comic" searchLabel={advancedSearchLabel} />

        <BrowseCatalogFilter
          action="/comic"
          defaultSort={sort}
          defaultPublishType={publishType}
          defaultAuthor={author}
          defaultTranslator={translator}
          labels={{
            newest: newestLabel,
            liked: likedLabel,
            rated: ratedLabel,
            anyPublishType: anyPublishTypeLabel,
            original: originalLabel,
            translation: translationLabel,
            reupload: reuploadLabel,
            author: authorLabel,
            translator: translatorLabel,
            apply: applyLabel,
          }}
        />

        <div className="mt-10">
          <WorksGrid works={works as any} showBookmarkButton />
        </div>
      </div>
    </ListSurface>
  );
}
