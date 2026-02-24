"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Kind = "genres" | "tags" | "warning-tags" | "deviant-love-tags";

type Item = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isSystem: boolean;
  isLocked: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

function slugFromName(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function fmtDate(iso?: string) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function useDebouncedValue<T>(value: T, ms = 250) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function InlineField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1">
      <div className="text-xs text-neutral-500">{label}</div>
      {children}
    </div>
  );
}

export default function TaxonomyManager({ kind, title }: { kind: Kind; title: string }) {
  const [q, setQ] = React.useState("");
  const qDebounced = useDebouncedValue(q, 250);
  const [includeInactive, setIncludeInactive] = React.useState(false);
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Item | null>(null);

  const [name, setName] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [isLocked, setIsLocked] = React.useState(false);
  const [isActive, setIsActive] = React.useState(true);

  const [saving, setSaving] = React.useState(false);
  const [orderDirty, setOrderDirty] = React.useState(false);

  const base = `/api/admin/taxonomy/${kind}`;
  const reorderDisabled = Boolean(qDebounced);
  const sortDisabled = Boolean(qDebounced);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const sp = new URLSearchParams();
      if (qDebounced) sp.set("q", qDebounced);
      if (includeInactive) sp.set("includeInactive", "1");
      const res = await fetch(`${base}?${sp.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load");
      setItems(data.items || []);
      setOrderDirty(false);
    } catch (e: any) {
      setErr(String(e?.message || e || "Failed to load"));
    } finally {
      setLoading(false);
    }
  }, [base, includeInactive, qDebounced]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  function openCreate() {
    setEditing(null);
    setName("");
    setSlug("");
    setIsLocked(false);
    setIsActive(true);
    setEditorOpen(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    setName(item.name || "");
    setSlug(item.slug || "");
    setIsLocked(!!item.isLocked);
    setIsActive(!!item.isActive);
    setEditorOpen(true);
  }

  async function saveEditor() {
    setSaving(true);
    setErr(null);
    try {
      const payload: any = {
        name: name.trim(),
        slug: slug.trim(),
        isLocked,
        isActive,
      };
      // if slug empty, let server slugify from name
      if (!payload.slug) delete payload.slug;

      const res = await fetch(editing ? `${base}/${editing.id}` : base, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save");

      setEditorOpen(false);
      await fetchList();
    } catch (e: any) {
      setErr(String(e?.message || e || "Failed to save"));
    } finally {
      setSaving(false);
    }
  }

  async function setActive(item: Item, next: boolean) {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`${base}/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      await fetchList();
    } catch (e: any) {
      setErr(String(e?.message || e || "Failed"));
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(item: Item) {
    if (!confirm(`Nonaktifkan "${item.name}"? (soft delete)`)) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`${base}/${item.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      await fetchList();
    } catch (e: any) {
      setErr(String(e?.message || e || "Failed"));
    } finally {
      setSaving(false);
    }
  }

  function move(idx: number, dir: -1 | 1) {
    if (reorderDisabled) return;
    const next = [...items];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    const tmp = next[idx];
    next[idx] = next[j];
    next[j] = tmp;
    setItems(next);
    setOrderDirty(true);
  }

  async function saveOrder() {
    if (!orderDirty || reorderDisabled) return;
    setSaving(true);
    setErr(null);
    try {
      const ids = items.map((x) => x.id);
      const res = await fetch(`${base}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to reorder");
      await fetchList();
    } catch (e: any) {
      setErr(String(e?.message || e || "Failed to reorder"));
    } finally {
      setSaving(false);
    }
  }

  async function applySort(by: "alpha" | "count", dir: "asc" | "desc") {
    if (sortDisabled) return;
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`${base}/sort`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ by, dir }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to sort");
      await fetchList();
    } catch (e: any) {
      setErr(String(e?.message || e || "Failed to sort"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold">{title}</div>
            <div className="text-sm text-neutral-500">Create / edit / nonaktifkan (soft delete) dan atur urutan.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={openCreate}>Add</Button>
            <Button variant="outline" onClick={fetchList} disabled={loading || saving}>
              Refresh
            </Button>
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800" />
            <Button
              variant="outline"
              onClick={() => applySort("alpha", "asc")}
              disabled={sortDisabled || loading || saving}
              title={sortDisabled ? "Clear search to sort" : "Sort A→Z"}
            >
              A→Z
            </Button>
            <Button
              variant="outline"
              onClick={() => applySort("alpha", "desc")}
              disabled={sortDisabled || loading || saving}
              title={sortDisabled ? "Clear search to sort" : "Sort Z→A"}
            >
              Z→A
            </Button>
            <Button
              variant="outline"
              onClick={() => applySort("count", "desc")}
              disabled={sortDisabled || loading || saving}
              title={sortDisabled ? "Clear search to sort" : "Sort by count (high→low)"}
            >
              Count ↓
            </Button>
            <Button
              variant="outline"
              onClick={() => applySort("count", "asc")}
              disabled={sortDisabled || loading || saving}
              title={sortDisabled ? "Clear search to sort" : "Sort by count (low→high)"}
            >
              Count ↑
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name/slug…"
            className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-800 dark:focus:ring-neutral-800 sm:max-w-sm"
          />
          <label className="flex select-none items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            Show inactive
          </label>
        </div>

        {err ? <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</div> : null}

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-xs text-neutral-500">
                <th className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-800">Order</th>
                <th className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-800">Name</th>
                <th className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-800">Slug</th>
                <th className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-800">Flags</th>
                <th className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-800">Updated</th>
                <th className="border-b border-neutral-200 px-2 py-2 dark:border-neutral-800">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-2 py-4 text-sm text-neutral-500" colSpan={6}>
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-2 py-4 text-sm text-neutral-500" colSpan={6}>
                    No items.
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr key={it.id} className="text-sm">
                    <td className="border-b border-neutral-100 px-2 py-2 align-top dark:border-neutral-900">
                      <div className="flex items-center gap-2">
                        <div className="w-10 text-xs text-neutral-500">{it.sortOrder}</div>
                        <div className="flex gap-1">
                          <button
                            className="rounded border border-neutral-200 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-800 dark:hover:bg-neutral-900"
                            onClick={() => move(idx, -1)}
                            disabled={reorderDisabled || idx === 0}
                            title="Move up"
                          >
                            ↑
                          </button>
                          <button
                            className="rounded border border-neutral-200 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-800 dark:hover:bg-neutral-900"
                            onClick={() => move(idx, 1)}
                            disabled={reorderDisabled || idx === items.length - 1}
                            title="Move down"
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="border-b border-neutral-100 px-2 py-2 align-top dark:border-neutral-900">
                      <div className="font-medium">{it.name}</div>
                      <div className="text-xs text-neutral-500">id: {it.id.slice(0, 8)}…</div>
                    </td>
                    <td className="border-b border-neutral-100 px-2 py-2 align-top font-mono text-xs dark:border-neutral-900">
                      {it.slug}
                    </td>
                    <td className="border-b border-neutral-100 px-2 py-2 align-top dark:border-neutral-900">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            it.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300"
                          }`}
                        >
                          {it.isActive ? "active" : "inactive"}
                        </span>
                        {it.isSystem ? (
                          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">system</span>
                        ) : (
                          <span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700">custom</span>
                        )}
                        {it.isLocked ? (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700">locked</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="border-b border-neutral-100 px-2 py-2 align-top text-xs text-neutral-500 dark:border-neutral-900">
                      {fmtDate(it.updatedAt)}
                    </td>
                    <td className="border-b border-neutral-100 px-2 py-2 align-top dark:border-neutral-900">
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={() => openEdit(it)} disabled={saving}>
                          Edit
                        </Button>
                        {it.isActive ? (
                          <Button
                            variant="outline"
                            onClick={() => deactivate(it)}
                            disabled={saving || it.isLocked}
                            title={it.isLocked ? "Locked" : "Deactivate"}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button variant="outline" onClick={() => setActive(it, true)} disabled={saving}>
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-neutral-500">
            {reorderDisabled
              ? "Reorder dimatikan saat search aktif (clear search untuk reorder)."
              : orderDirty
              ? "Order changed (not saved yet)."
              : ""}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={saveOrder} disabled={reorderDisabled || !orderDirty || saving || loading}>
              Save order
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit item" : "Create item"}</DialogTitle>
            <DialogDescription>
              Perubahan ini langsung tersimpan ke database. “Deactivate” hanya menonaktifkan (soft delete).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <InlineField label="Name">
              <input
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                  // auto-suggest slug only when creating and slug empty
                  if (!editing && !slug) setSlug(slugFromName(v));
                }}
                className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-800 dark:focus:ring-neutral-800"
                placeholder="e.g. Manhwa"
              />
            </InlineField>

            <InlineField label="Slug">
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-800 dark:focus:ring-neutral-800"
                placeholder={name ? slugFromName(name) : "e.g. manhwa"}
              />
              <div className="text-xs text-neutral-500">Kosongkan kalau mau auto dari name.</div>
            </InlineField>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-200">
                <input type="checkbox" checked={isLocked} onChange={(e) => setIsLocked(e.target.checked)} />
                Locked
              </label>
            </div>

            {editing ? (
              <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-300">
                <div>System: {editing.isSystem ? "true" : "false"}</div>
                <div>Created: {fmtDate(editing.createdAt)}</div>
                <div>Updated: {fmtDate(editing.updatedAt)}</div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveEditor} disabled={saving || !name.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
