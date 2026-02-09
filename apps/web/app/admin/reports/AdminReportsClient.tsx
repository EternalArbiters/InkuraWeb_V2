"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

type ReportItem = {
  id: string;
  createdAt: string;
  reason: string;
  reporter: { id: string; username: string; name: string | null };
  targetId: string;
  comment: {
    id: string;
    body: string;
    isHidden: boolean;
    createdAt: string;
    user: { id: string; username: string; name: string | null };
    chapter: { id: string; title: string; number: number; work: { id: string; title: string; slug: string } };
  } | null;
};

export default function AdminReportsClient({ initial }: { initial: ReportItem[] }) {
  const [items, setItems] = useState(initial);
  const [isPending, startTransition] = useTransition();

  const act = (reportId: string, payload: any) => {
    startTransition(async () => {
      await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => null);
      setItems((prev) => prev.filter((r) => r.id !== reportId));
    });
  };

  return (
    <div className="mt-6 space-y-4">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
          <div className="text-lg font-bold">No open reports</div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">All reports have been handled.</p>
        </div>
      ) : (
        items.map((r) => (
          <div key={r.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-bold">Report #{r.id.slice(-6)}</div>
                <div className="mt-1 text-sm text-gray-700 dark:text-gray-200">Reason: <b>{r.reason}</b></div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                  by @{r.reporter.username} • {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={isPending}
                  onClick={() => act(r.id, { status: "DISMISSED", note: "Dismissed" })}
                  className="rounded-full px-3 py-2 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
                >
                  Dismiss
                </button>
                <button
                  disabled={isPending}
                  onClick={() => act(r.id, { status: "RESOLVED", note: "Resolved" })}
                  className="rounded-full px-3 py-2 text-xs font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110 disabled:opacity-60"
                >
                  Resolve
                </button>
              </div>
            </div>

            {r.comment ? (
              <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Comment by @{r.comment.user.username} • {new Date(r.comment.createdAt).toLocaleString()}
                </div>
                <div className="mt-2 text-sm whitespace-pre-wrap">{r.comment.body}</div>
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-300">
                  In: <b>{r.comment.chapter.work.title}</b> • Chapter {r.comment.chapter.number}: {r.comment.chapter.title}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/w/${r.comment.chapter.work.slug}/read/${r.comment.chapter.id}`}
                    className="rounded-full px-3 py-2 text-xs font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Open reader
                  </Link>
                  <button
                    disabled={isPending}
                    onClick={() => act(r.id, { status: "RESOLVED", hideComment: true, note: "Hidden comment" })}
                    className="rounded-full px-3 py-2 text-xs font-semibold bg-red-600 text-white hover:brightness-110 disabled:opacity-60"
                  >
                    Hide comment + Resolve
                  </button>
                  {r.comment.isHidden ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      already hidden
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">Comment not found (maybe deleted).</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
