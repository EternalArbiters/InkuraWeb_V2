import PageScaffold from "../components/PageScaffold";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export default async function PrivacyPage() {
  const [title, description, homeLabel, privacyLabel, bodyText] = await Promise.all([
    getActiveUILanguageText("Privacy Policy", { section: "Page Privacy" }),
    getActiveUILanguageText("Placeholder privacy policy.", { section: "Page Privacy" }),
    getActiveUILanguageText("Home", { section: "Page Home" }),
    getActiveUILanguageText("Privacy", { section: "Page Privacy" }),
    getActiveUILanguageText("This will later be filled with a complete privacy policy (collected data, cookies, analytics, and user rights).", { section: "Page Privacy" }),
  ]);

  return (
    <PageScaffold
      title={title}
      description={description}
      crumbs={[
        { label: homeLabel, href: "/home" },
        { label: privacyLabel, href: "/privacy" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">{bodyText}</p>
      </div>
    </PageScaffold>
  );
}
