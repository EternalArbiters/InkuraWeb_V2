"use client";

import Link from "next/link";
import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import PublishToggle from "./works/[workId]/PublishToggle";

type WorkLite = {
  id: string;
  slug: string;
  title: string;
  coverImage?: string | null;
  status: "DRAFT" | "PUBLISHED";
  type?: string | null;
  publishType?: string | null;
  updatedAt?: string | null;
};

export default function StudioWorksGridClient({ works }: { works: WorkLite[] }) {
  const [items, setItems] = React.useState<WorkLite[]>(works);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setItems(works);
  }, [works]);

  const del = async (workId: string) => {
    const ok = confirm("Delete this work? This will remove the work, chapters, and related data. This can't be undone.");
    if (!ok) return;

    setError(null);
    setDeletingId(workId);
    try {
      const res = await fetch(`/api/studio/works/${workId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      setItems((prev) => prev.filter((item) => item.id !== workId));
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-4">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-4 text-sm dark:border-red-900 dark:bg-red-950/40">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((w) => (
          <div key={w.id} className="overflow-hidden rounded-[16px] border border-gray-200 bg-white/70 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="relative aspect-[3/4] overflow-hidden rounded-[16px] bg-gray-100 dark:bg-gray-800">
              <Link
                href={`/w/${w.slug}`}
                className="absolute inset-0 z-0 block"
                title="View public page"
                aria-label={`View public page for ${w.title}`}
              >
                {w.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.coverImage} alt={w.title} className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">No cover</div>
                )}
              </Link>

              <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
                <Link
                  href={`/studio/works/${w.id}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70"
                  title="Open / Edit"
                  aria-label="Open / Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => del(w.id)}
                  disabled={deletingId === w.id}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/70 disabled:opacity-60"
                  title="Delete"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-2 p-3">
              <PublishToggle
                workId={w.id}
                status={w.status}
                onStatusChange={(nextStatus) =>
                  setItems((prev) => prev.map((item) => (item.id === w.id ? { ...item, status: nextStatus } : item)))
                }
              />
              <div className="line-clamp-2 text-sm font-bold leading-snug">{w.title}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                {w.type ? `${w.type} • ` : ""}
                {w.publishType || ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
