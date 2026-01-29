import PageScaffold from "../components/PageScaffold";

export default function TermsPage() {
  return (
    <PageScaffold
      title=" Terms & Conditions"
      description="Placeholder terms & conditions."
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Terms", href: "/terms" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Nanti kita isi dengan aturan upload (copyright), community guidelines, dan kebijakan moderation.
        </p>
      </div>
    </PageScaffold>
  );
}
