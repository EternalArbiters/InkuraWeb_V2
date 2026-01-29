import PageScaffold from "../components/PageScaffold";

export default function AppDownloadPage() {
  return (
    <PageScaffold
      title=" App Download"
      description="Placeholder. Nanti diisi link Play Store / App Store."
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "App Download", href: "/app-download" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Coming soon.
        </p>
      </div>
    </PageScaffold>
  );
}
