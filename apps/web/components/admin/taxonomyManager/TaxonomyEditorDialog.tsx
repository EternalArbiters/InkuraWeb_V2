"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import InlineField from "./InlineField";
import type { Item } from "./types";
import { fmtDate, slugFromName } from "./utils";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  editing: Item | null;

  name: string;
  setName: (v: string) => void;
  slug: string;
  setSlug: (v: string) => void;
  isLocked: boolean;
  setIsLocked: (v: boolean) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;

  saving: boolean;
  onSave: () => void;
};

export default function TaxonomyEditorDialog({
  open,
  setOpen,
  editing,
  name,
  setName,
  slug,
  setSlug,
  isLocked,
  setIsLocked,
  isActive,
  setIsActive,
  saving,
  onSave,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={saving || !name.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
