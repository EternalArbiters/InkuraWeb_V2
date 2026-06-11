"use client";

import * as React from "react";

type WorkItem = {
  id: string;
  title: string;
  slug: string;
  type: string;
  publishType: string;
  status: string;
  createdAt: string;
  author: { id: string; username: string | null; name: string | null };
};

const PUBLISH_TYPE_OPTIONS = [
  { value: "ORIGINAL", label: "Original" },
  { value: "TRANSLATION", label: "Translation" },
  { value: "REUPLOAD", label: "Re-upload" },
] as const;

function publishTypeLabel(pt: string) {
  return PUBLISH_TYPE_OPTIONS.find((o) => o.value === pt)?.label ?? pt;
}

function publishTypeBadgeClass(pt: string) {
  if (pt === "ORIGINAL") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200";
  if (pt === "TRANSLATION") return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200";
}

export default function AdminWorksClient() {
  const [query, setQuery] = React.useState("");
  const [works, setWorks] = React.useState<WorkItem[]>([]);
  const [searched, setSearched] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<Record<string, string>>({});
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/admin/works?${params}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Search failed");
      setWorks(data.works ?? []);
      setDrafts({});
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function savePublishType(workId: string) {
    const next = drafts[workId];
    if (!next) return;
    setSaving(workId);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/works/${workId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ publishType: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || "Failed to save");
      setWorks((prev) => prev.map((w) => (w.id === workId ? { ...w, publishType: next } : w)));
      setDrafts((prev) => {
        const copy = { ...prev };
        delete copy[workId];
        return copy;
      });
      setMessage("Publish type updated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          {message}
        </div>
      ) : null}

      <div>
        <p className="mb-3 text-sm text-neutral-500">
          Search by work title or author username. Leave blank to show the 60 most recently updated works.
        </p>
        <form onSubmit={doSearch} className="flex gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title or @username..."
            className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl border border-neutral-200 px-5 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {searched ? (
        <div>
          <p className="mb-3 text-sm text-neutral-500">{works.length} result{works.length !== 1 ? "s" : ""}</p>

          {works.length === 0 ? (
            <p className="text-sm text-neutral-400">No works found.</p>
          ) : (
            <div className="space-y-2">
              {works.map((work) => {
                const draft = drafts[work.id];
                const changed = draft && draft !== work.publishType;
                const isSaving = saving === work.id;

                return (
                  <div
                    key={work.id}
                    className="flex flex-col gap-3 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{work.title}</span>
                        <span className="rounded-full border border-neutral-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-700">
                          {work.type}
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${publishTypeBadgeClass(work.publishType)}`}>
                          {publishTypeLabel(work.publishType)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-neutral-400">
                        by {work.author.name || work.author.username || work.author.id}
                        {work.author.username ? ` (@${work.author.username})` : ""}
                        {" · "}
                        {work.status}
                        {" · "}
                        {new Date(work.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <select
                        value={draft ?? work.publishType}
                        onChange={(e) => setDrafts((prev) => ({ ...prev, [work.id]: e.target.value }))}
                        disabled={isSaving}
                        className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-neutral-800 dark:bg-neutral-900"
                      >
                        {PUBLISH_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => savePublishType(work.id)}
                        disabled={!changed || isSaving}
                        className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
