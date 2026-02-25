import BrowseListPage from "../_components/BrowseListPage";

export const dynamic = "force-dynamic";

export default async function TrendingNovelsPage() {
  return <BrowseListPage title="Trending Novels" qs={new URLSearchParams({ take: "80", type: "NOVEL", sort: "liked" }).toString()} />;
}
