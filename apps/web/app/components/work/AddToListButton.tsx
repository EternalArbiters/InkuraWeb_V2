"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ListPlus, Check, Loader2 } from "lucide-react";

type ListLite = {
  id: string;
  slug: string;
  title: string;
  isPublic: boolean;
  _count?: { items: number };
};

export default function AddToListButton({ workId }: { workId: string }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ListLite[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [added, setAdded] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lists", { method: "GET" });
      if (!res.ok) {
        setLists([]);
        return;
      }
      const data = await res.json().catch(() => null);
      setLists(Array.isArray(data?.lists) ? data.lists : []);
    } catch {
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const on = () => setIsMobile(!!mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);

  useEffect(() => {
    if (open && lists == null) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const addToList = async (listId: string) => {
    setAddingId(listId);
    try {
      const res = await fetch(`/api/lists/${listId}/items`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workId }),
      });
      if (res.ok) {
        setAdded((p) => ({ ...p, [listId]: true }));
        setTimeout(() => setAdded((p) => ({ ...p, [listId]: false })), 1200);
      }
    } catch {
      // ignore
    } finally {
      setAddingId(null);
    }
  };

  const label = useMemo(() => {
    if (!open) return "Add to List";
    return "Close";
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        aria-label="Add to List"
      >
        <ListPlus size={18} />
        <span>{label}</span>
      </button>

      {open ? (
        isMobile ? (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 max-h-[75vh] rounded-t-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="text-sm font-extrabold">Add to list</div>
                <div className="flex items-center gap-3">
                  <Link href="/lists/new" onClick={() => setOpen(false)} className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                    New
                  </Link>
                  <Link href="/lists" onClick={() => setOpen(false)} className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                    Manage
                  </Link>
                </div>
              </div>

              <div className="max-h-[55vh] overflow-auto">
                {loading ? (
                  <div className="p-4 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} /> Loading...
                  </div>
                ) : lists && lists.length ? (
                  <ul className="p-2">
                    {lists.map((l) => {
                      const isAdding = addingId === l.id;
                      const done = !!added[l.id];
                      return (
                        <li key={l.id}>
                          <button
                            type="button"
                            onClick={() => addToList(l.id)}
                            disabled={isAdding}
                            className="w-full flex items-center justify-between gap-2 px-3 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 text-left"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate">{l.title}</div>
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                {(l._count?.items ?? 0)} item • {l.isPublic ? "Public" : "Private"}
                              </div>
                            </div>

                            <div className="shrink-0">
                              {done ? <Check size={18} className="text-emerald-600" /> : isAdding ? <Loader2 className="animate-spin" size={18} /> : null}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
                    There is no list yet.{" "}
                    <Link href="/lists/new" onClick={() => setOpen(false)} className="underline text-purple-600 dark:text-purple-400">
                      Create List
                    </Link>{" "}
                    dulu.
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full px-3 py-3 rounded-2xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute z-50 mt-2 right-0 w-[320px] max-w-[80vw] rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl overflow-hidden">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="text-sm font-extrabold">Add to list</div>
              <div className="flex items-center gap-2">
                <Link href="/lists/new" className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                  New
                </Link>
                <Link href="/lists" className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                  Manage
                </Link>
              </div>
            </div>

            <div className="max-h-[320px] overflow-auto">
              {loading ? (
                <div className="p-4 text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} /> Loading...
                </div>
              ) : lists && lists.length ? (
                <ul className="p-2">
                  {lists.map((l) => {
                    const isAdding = addingId === l.id;
                    const done = !!added[l.id];
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => addToList(l.id)}
                          disabled={isAdding}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 text-left"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{l.title}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                              {(l._count?.items ?? 0)} item • {l.isPublic ? "Public" : "Private"}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {done ? <Check size={18} className="text-emerald-600" /> : isAdding ? <Loader2 className="animate-spin" size={18} /> : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="p-4 text-sm text-gray-600 dark:text-gray-300">
                  There is no list yet. <Link href="/lists/new" className="underline text-purple-600 dark:text-purple-400">Create list</Link> first.
                </div>
              )}
            </div>

            <div className="p-2 border-t border-gray-200 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full px-3 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}
