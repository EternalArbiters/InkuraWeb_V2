/**
 * Modern page surface (the `<main>` background) using the ink design tokens.
 * Server pages wrap their content with this to get the modern look without
 * becoming client components themselves.
 */
export default function ListSurface({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`min-h-[calc(100vh-96px)] bg-[var(--ink-bg)] text-[var(--ink-fg)] ${className || ""}`}
    >
      {children}
    </main>
  );
}
