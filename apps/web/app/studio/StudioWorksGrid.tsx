"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import PublishToggle from "./works/[workId]/PublishToggle";

type WorkItem = {
  id: string;
  title: string;
  type?: string;
  publishType?: string | null;
  status: "DRAFT" | "PUBLISHED";
  coverImage?: string | null;
};

export default function StudioWorksGrid({ works }: { works: WorkItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<WorkItem | null>(null);

  const sortedWorks = useMemo(() => works || [], [works]);

  const doDelete = (work: WorkItem) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/studio/works/${work.id}`, { method: "DELETE" });
        const data = await res.json().catch(() => ({} as any));
        if (!res.ok) {
          setError(data?.error || "Gagal menghapus karya");
          return;
        }
        setConfirm(null);
        router.refresh();
      } catch (e) {
        console.error(e);
        setError("Gagal menghapus karya");
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedWorks.map((w) => (
          <div key={w.id} className="group">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900">
              {w.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={w.coverImage}
                  alt={w.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
                  No cover
                </div>
              )}

              {/* Action buttons inside cover */}
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <Link
                  href={`/studio/works/${w.id}`}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/70 dark:bg-black/55 text-gray-900 dark:text-white backdrop-blur border border-black/10 dark:border-white/10 hover:bg-white/85 dark:hover:bg-black/70 transition"
                  title="Edit / Open"
                  aria-label={`Open ${w.title}`}
                >
                  <Pencil className="w-5 h-5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirm(w)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/70 dark:bg-black/55 text-gray-900 dark:text-white backdrop-blur border border-black/10 dark:border-white/10 hover:bg-white/85 dark:hover:bg-black/70 transition"
                  title="Delete"
                  aria-label={`Delete ${w.title}`}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-2">
              <PublishToggle workId={w.id} status={w.status} fullWidth />
              <div className="text-sm font-semibold leading-snug line-clamp-2">{w.title}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                {w.type ? `${w.type} • ` : ""}
                {String(w.publishType || "ORIGINAL").toUpperCase()}
              </div>
            </div>
          </div>
        ))}

        {sortedWorks.length === 0 ? (
          <div className="col-span-2 sm:col-span-3 lg:col-span-4 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 text-sm text-gray-600 dark:text-gray-300">
            Belum ada karya.
          </div>
        ) : null}
      </div>

      {/* Confirm delete modal */}
      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => (isPending ? null : setConfirm(null))} />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-5 shadow-xl">
            <div className="text-lg font-extrabold">Delete work?</div>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Kamu yakin mau menghapus <b>{confirm.title}</b>? Ini akan menghapus chapter, pages/text, komentar, dan data terkait.
            </p>

            {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setConfirm(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => doDelete(confirm)}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                {isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
