import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import ListSurface from "@/app/components/ListSurface";
import ScaffoldHeader from "@/app/components/ScaffoldHeader";

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
    <ListSurface>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <ScaffoldHeader
          title={translatedTitle}
          description={translatedDescription}
          crumbs={translatedCrumbs}
        />
        {children}
      </div>
    </ListSurface>
  );
}
