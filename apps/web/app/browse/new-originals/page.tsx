import BrowseListPage from "../_components/BrowseListPage";

export const dynamic = "force-dynamic";

export default async function NewOriginalsPage() {
  return (
    <BrowseListPage
      title="New Originals"
      qs={new URLSearchParams({ take: "80", publishType: "ORIGINAL", sort: "newest" }).toString()}
    />
  );
}
