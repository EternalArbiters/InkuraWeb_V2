import Link from "next/link";
import PageScaffold from "../components/PageScaffold";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export default async function NewsletterPage() {
  const [title, description, homeLabel, newsletterLabel, bodyText, returnLabel] = await Promise.all([
    getActiveUILanguageText("Newsletter", { section: "Page Newsletter" }),
    getActiveUILanguageText("Placeholder. A subscribe form will be added later.", { section: "Page Newsletter" }),
    getActiveUILanguageText("Home", { section: "Page Home" }),
    getActiveUILanguageText("Newsletter", { section: "Page Newsletter" }),
    getActiveUILanguageText("Coming soon. For now, go back to the feed.", { section: "Page Newsletter" }),
    getActiveUILanguageText("Return to All", { section: "Page Contact" }),
  ]);

  return (
    <PageScaffold
      title={title}
      description={description}
      crumbs={[
        { label: homeLabel, href: "/home" },
        { label: newsletterLabel, href: "/newsletter" },
      ]}
    >
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300">{bodyText}</p>
        <div className="mt-4">
          <Link
            href="/all"
            className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110"
          >
            {returnLabel}
          </Link>
        </div>
      </div>
    </PageScaffold>
  );
}
