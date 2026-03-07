import BrowseListPage from "../_components/BrowseListPage";


export default async function RecentUpdatesPage() {
  return <BrowseListPage title="Recently Updated" qs={new URLSearchParams({ take: "80", sort: "newest" }).toString()} />;
}
