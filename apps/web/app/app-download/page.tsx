import PageScaffold from "../components/PageScaffold";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export default async function AppDownloadPage() {
  const [homeLabel, title, description, soonLabel] = await Promise.all([
    getActiveUILanguageText("Home", { section: "Page Home" }),
    getActiveUILanguageText("App Download", { section: "Page App Download" }),
    getActiveUILanguageText("Placeholder. Play Store / App Store links will be added later.", { section: "Page App Download" }),
    getActiveUILanguageText("Coming soon.", { section: "Page App Download" }),
  ]);

  return (
    <PageScaffold
      title={title}
      description={description}
      crumbs={[
        { label: homeLabel, href: "/home" },
        { label: title, href: "/app-download" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">{soonLabel}</p>
      </div>
    </PageScaffold>
  );
}
