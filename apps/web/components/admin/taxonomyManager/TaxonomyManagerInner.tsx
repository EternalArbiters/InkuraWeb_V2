"use client";

import * as React from "react";

import type { Item, Kind } from "./types";
import { useDebouncedValue } from "./useDebouncedValue";
import TaxonomyEditorDialog from "./TaxonomyEditorDialog";
import TaxonomyTable from "./TaxonomyTable";

export default function TaxonomyManagerInner({ kind, title }: { kind: Kind; title: string }) {
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

  async function setActiveForItem(item: Item, next: boolean) {
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
    if (!confirm(`Deactivate "${item.name}"? (soft delete)`)) return;
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
      <TaxonomyTable
        title={title}
        q={q}
        onChangeQ={setQ}
        includeInactive={includeInactive}
        onToggleIncludeInactive={setIncludeInactive}
        items={items}
        loading={loading}
        saving={saving}
        err={err}
        reorderDisabled={reorderDisabled}
        orderDirty={orderDirty}
        onAdd={openCreate}
        onRefresh={fetchList}
        onSortAlphaAsc={() => applySort("alpha", "asc")}
        onSortAlphaDesc={() => applySort("alpha", "desc")}
        onSortCountDesc={() => applySort("count", "desc")}
        onSortCountAsc={() => applySort("count", "asc")}
        sortDisabled={sortDisabled}
        onMove={move}
        onOpenEdit={openEdit}
        onDeactivate={deactivate}
        onSetActive={setActiveForItem}
        onSaveOrder={saveOrder}
      />

      <TaxonomyEditorDialog
        open={editorOpen}
        setOpen={setEditorOpen}
        editing={editing}
        name={name}
        setName={setName}
        slug={slug}
        setSlug={setSlug}
        isLocked={isLocked}
        setIsLocked={setIsLocked}
        isActive={isActive}
        setIsActive={setIsActive}
        saving={saving}
        onSave={saveEditor}
      />
    </div>
  );
}
