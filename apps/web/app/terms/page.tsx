import PageScaffold from "../components/PageScaffold";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export default async function TermsPage() {
  const [title, description, homeLabel, termsLabel, bodyText] = await Promise.all([
    getActiveUILanguageText("Terms & Conditions", { section: "Page Terms" }),
    getActiveUILanguageText("Placeholder terms & conditions.", { section: "Page Terms" }),
    getActiveUILanguageText("Home", { section: "Page Home" }),
    getActiveUILanguageText("Terms", { section: "Page Terms" }),
    getActiveUILanguageText("This will later be filled with upload rules (copyright), community guidelines, and moderation policies.", { section: "Page Terms" }),
  ]);

  return (
    <PageScaffold
      title={title}
      description={description}
      crumbs={[
        { label: homeLabel, href: "/home" },
        { label: termsLabel, href: "/terms" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">{bodyText}</p>
      </div>
    </PageScaffold>
  );
}
