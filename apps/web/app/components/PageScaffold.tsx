import Link from "next/link";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";

type PageScaffoldLookupOptions = {
  section?: string;
};

export default async function PageScaffold({
  title,
  titleLookupOptions,
  description,
  descriptionLookupOptions,
  crumbs,
  children,
}: {
  title: string;
  titleLookupOptions?: PageScaffoldLookupOptions;
  description?: string;
  descriptionLookupOptions?: PageScaffoldLookupOptions;
  crumbs?: Array<{ label: string; href: string }>;
  children?: React.ReactNode;
}) {
  const translatedTitle = await getActiveUILanguageText(title, titleLookupOptions);
  const translatedDescription = description
    ? await getActiveUILanguageText(description, descriptionLookupOptions)
    : undefined;
  const translatedCrumbs = crumbs?.length
    ? await Promise.all(
        crumbs.map(async (crumb) => ({
          ...crumb,
          label: await getActiveUILanguageText(crumb.label),
        }))
      )
    : [];

  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {translatedCrumbs?.length ? (
          <nav className="text-sm mb-6 text-gray-600 dark:text-gray-300">
            <ol className="flex flex-wrap gap-2">
              {translatedCrumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-2">
                  <Link className="hover:text-pink-500" href={c.href}>
                    {c.label}
                  </Link>
                  {i !== translatedCrumbs.length - 1 && <span className="opacity-60">/</span>}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{translatedTitle}</h1>
          {translatedDescription ? (
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-3xl">
              {translatedDescription}
            </p>
          ) : null}
        </header>

        {children}
      </div>
    </main>
  );
}
