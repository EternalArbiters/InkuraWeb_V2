import Link from "next/link";

import { requireAdmin } from "@/server/auth/requireUser";

export const runtime = "nodejs";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900"
    >
      {label}
    </Link>
  );
}

export default async function AdminTaxonomyLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin • Taxonomy</h1>
          <p className="text-sm text-neutral-500">Manage genres, tags, warnings, and Deviant Love directly from the web UI.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <NavLink href="/admin/reports" label="Reports" />
          <NavLink href="/admin/notify" label="Notify" />
          <NavLink href="/admin/taxonomy/genres" label="Genres" />
          <NavLink href="/admin/taxonomy/warnings" label="Warnings" />
          <NavLink href="/admin/taxonomy/deviant-love" label="Deviant Love" />
          <NavLink href="/admin/taxonomy/tags" label="Tags" />
        </div>
      </div>
      {children}
    </div>
  );
}
