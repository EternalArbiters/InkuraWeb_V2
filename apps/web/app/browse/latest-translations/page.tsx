import BrowseListPage from "../_components/BrowseListPage";


export default async function LatestTranslationsPage() {
  return (
    <BrowseListPage
      title="Latest Translations"
      qs={new URLSearchParams({ take: "80", publishType: "TRANSLATION", sort: "newest" }).toString()}
    />
  );
}
