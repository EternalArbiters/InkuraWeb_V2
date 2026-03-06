"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { Item } from "./types";
import { fmtDate } from "./utils";

type Props = {
  title: string;
  description?: string;

  q: string;
  onChangeQ: (v: string) => void;

  includeInactive: boolean;
  onToggleIncludeInactive: (v: boolean) => void;

  items: Item[];
  loading: boolean;
  saving: boolean;
  err: string | null;

  reorderDisabled: boolean;
  orderDirty: boolean;

  onAdd: () => void;
  onRefresh: () => void;

  onSortAlphaAsc: () => void;
  onSortAlphaDesc: () => void;
  onSortCountDesc: () => void;
  onSortCountAsc: () => void;
  sortDisabled: boolean;

  onMove: (idx: number, dir: -1 | 1) => void;
  onOpenEdit: (item: Item) => void;
  onDeactivate: (item: Item) => void;
  onSetActive: (item: Item, next: boolean) => void;

  onSaveOrder: () => void;
};

export default function TaxonomyTable({
  title,
  description,
  q,
  onChangeQ,
  includeInactive,
  onToggleIncludeInactive,
  items,
  loading,
  saving,
  err,
  reorderDisabled,
  orderDirty,
  onAdd,
  onRefresh,
  onSortAlphaAsc,
  onSortAlphaDesc,
  onSortCountDesc,
  onSortCountAsc,
  sortDisabled,
  onMove,
  onOpenEdit,
  onDeactivate,
  onSetActive,
  onSaveOrder,
}: Props) {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-semibold">{title}</div>
          <div className="text-sm text-neutral-500">
            {description || "Create / edit / nonaktifkan (soft delete) dan atur urutan."}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={onAdd}>Add</Button>
          <Button variant="outline" onClick={onRefresh} disabled={loading || saving}>
            Refresh
          </Button>
          <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800" />
          <Button
            variant="outline"
            onClick={onSortAlphaAsc}
            disabled={sortDisabled || loading || saving}
            title={sortDisabled ? "Clear search to sort" : "Sort A→Z"}
          >
            A→Z
          </Button>
          <Button
            variant="outline"
            onClick={onSortAlphaDesc}
            disabled={sortDisabled || loading || saving}
            title={sortDisabled ? "Clear search to sort" : "Sort Z→A"}
          >
            Z→A
          </Button>
          <Button
            variant="outline"
            onClick={onSortCountDesc}
            disabled={sortDisabled || loading || saving}
            title={sortDisabled ? "Clear search to sort" : "Sort by count (high→low)"}
          >
            Count ↓
          </Button>
          <Button
            variant="outline"
            onClick={onSortCountAsc}
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
          onChange={(e) => onChangeQ(e.target.value)}
          placeholder="Search name/slug…"
          className="w-full rounded-lg border border-neutral-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200 dark:border-neutral-800 dark:focus:ring-neutral-800 sm:max-w-sm"
        />
        <label className="flex select-none items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
          <input type="checkbox" checked={includeInactive} onChange={(e) => onToggleIncludeInactive(e.target.checked)} />
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
                          onClick={() => onMove(idx, -1)}
                          disabled={reorderDisabled || idx === 0}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          className="rounded border border-neutral-200 px-2 py-1 text-xs hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-800 dark:hover:bg-neutral-900"
                          onClick={() => onMove(idx, 1)}
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
                      <Button variant="outline" onClick={() => onOpenEdit(it)} disabled={saving}>
                        Edit
                      </Button>
                      {it.isActive ? (
                        <Button
                          variant="outline"
                          onClick={() => onDeactivate(it)}
                          disabled={saving || it.isLocked}
                          title={it.isLocked ? "Locked" : "Deactivate"}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button variant="outline" onClick={() => onSetActive(it, true)} disabled={saving}>
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
          <Button variant="outline" onClick={onSaveOrder} disabled={reorderDisabled || !orderDirty || saving || loading}>
            Save order
          </Button>
        </div>
      </div>
    </Card>
  );
}
