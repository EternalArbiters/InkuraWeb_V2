import Link from "next/link";

export default function PageScaffold({
  title,
  description,
  crumbs,
  children,
}: {
  title: string;
  description?: string;
  crumbs?: Array<{ label: string; href: string }>;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {crumbs?.length ? (
          <nav className="text-sm mb-6 text-gray-600 dark:text-gray-300">
            <ol className="flex flex-wrap gap-2">
              {crumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-2">
                  <Link className="hover:text-pink-500" href={c.href}>
                    {c.label}
                  </Link>
                  {i !== crumbs.length - 1 && <span className="opacity-60">/</span>}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-3xl">
              {description}
            </p>
          ) : null}
        </header>

        {children}

      </div>
    </main>
  );
}
