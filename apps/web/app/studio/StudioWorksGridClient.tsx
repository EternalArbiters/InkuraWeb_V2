"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import PublishToggle from "./works/[workId]/PublishToggle";

type WorkLite = {
  id: string;
  title: string;
  coverImage?: string | null;
  status: "DRAFT" | "PUBLISHED";
  type?: string | null;
  publishType?: string | null;
  updatedAt?: string | null;
};

export default function StudioWorksGridClient({ works }: { works: WorkLite[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const del = async (workId: string) => {
    const ok = confirm("Delete this work? This will remove the work, chapters, and related data. This can't be undone.");
    if (!ok) return;

    setError(null);
    setDeletingId(workId);
    try {
      const res = await fetch(`/api/studio/works/${workId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || "Delete failed");
      router.refresh();
    } catch (e: any) {
      setError(e?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid gap-4">
      {error ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {works.map((w) => (
          <div key={w.id} className="border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 overflow-hidden">
            <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800">
              {w.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={w.coverImage} alt={w.title} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">No cover</div>
              )}

              {/* overlay actions */}
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <Link
                  href={`/studio/works/${w.id}`}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70 transition"
                  title="Open / Edit"
                  aria-label="Open / Edit"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => del(w.id)}
                  disabled={deletingId === w.id}
                  className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70 transition disabled:opacity-60"
                  title="Delete"
                  aria-label="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-3 grid gap-2">
              <PublishToggle workId={w.id} status={w.status} />
              <div className="text-sm font-bold leading-snug line-clamp-2">{w.title}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                {w.type ? `${w.type} • ` : ""}{w.publishType || ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
