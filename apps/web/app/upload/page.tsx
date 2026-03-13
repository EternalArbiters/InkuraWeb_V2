import Link from "next/link";
import PageScaffold from "../components/PageScaffold";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

export default async function UploadPage() {
  const [
    homeLabel,
    uploadLabel,
    description,
    creatorStudioLabel,
    creatorStudioBody,
    openStudioLabel,
    createWorkLabel,
    readerLabel,
    readerBody,
    exploreLabel,
  ] = await Promise.all([
    getActiveUILanguageText("Home", { section: "Page Home" }),
    getActiveUILanguageText("Upload", { section: "Navigation" }),
    getActiveUILanguageText("Uploads have moved to Creator Studio (Work → Chapter → text/pages).", { section: "Page Upload" }),
    getActiveUILanguageText("Creator Studio", { section: "Page Upload" }),
    getActiveUILanguageText("Create a Work (NOVEL/COMIC), create a Chapter, then upload: text for novels or images for comics.", { section: "Page Upload" }),
    getActiveUILanguageText("Open Studio", { section: "Page Upload" }),
    getActiveUILanguageText("Create New Work", { section: "Page Upload" }),
    getActiveUILanguageText("Reader", { section: "Page Upload" }),
    getActiveUILanguageText("The reader supports NOVEL (text) and COMIC (vertical pages).", { section: "Page Upload" }),
    getActiveUILanguageText("Explore", { section: "Page Upload" }),
  ]);

  return (
    <PageScaffold
      title={`⬆ ${uploadLabel}`}
      description={description}
      crumbs={[
        { label: homeLabel, href: "/home" },
        { label: uploadLabel, href: "/upload" },
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
          <h2 className="text-xl font-bold">{creatorStudioLabel}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{creatorStudioBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/studio"
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-110"
            >
              {openStudioLabel}
            </Link>
            <Link
              href="/studio/new"
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {createWorkLabel}
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
          <h2 className="text-xl font-bold">{readerLabel}</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{readerBody}</p>
          <div className="mt-4">
            <Link
              href="/all"
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {exploreLabel}
            </Link>
          </div>
        </div>
      </div>
    </PageScaffold>
  );
}
