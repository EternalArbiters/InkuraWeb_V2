import BrowseListPage from "../_components/BrowseListPage";

export const dynamic = "force-dynamic";

export default async function TrendingComicsPage() {
  return <BrowseListPage title="Trending Comics" qs={new URLSearchParams({ take: "80", type: "COMIC", sort: "liked" }).toString()} />;
}
