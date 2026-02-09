import PageScaffold from "../components/PageScaffold";

export default function PrivacyPage() {
  return (
    <PageScaffold
      title=" Privacy Policy"
      description="Placeholder kebijakan privasi."
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Privacy", href: "/privacy" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Nanti kita isi dengan kebijakan privasi lengkap (data yang dikumpulkan, cookie, analytics, dan hak pengguna).
        </p>
      </div>
    </PageScaffold>
  );
}
