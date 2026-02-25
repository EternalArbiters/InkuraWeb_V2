import BrowseListPage from "../_components/BrowseListPage";

export const dynamic = "force-dynamic";

export default async function LatestTranslationsPage() {
  return (
    <BrowseListPage
      title="Latest Translations"
      qs={new URLSearchParams({ take: "80", publishType: "TRANSLATION", sort: "newest" }).toString()}
    />
  );
}
