"use client";

import * as React from "react";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";
import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";

type Props = {
  genres: PickerItem[];
  warnings: PickerItem[];
  initial: {
    matureOptIn: boolean;
    preferredLanguages: string[];
    blockedGenreIds: string[];
    blockedWarningIds: string[];
  };
};

export default function PreferencesForm({ genres, warnings, initial }: Props) {
  const [matureOptIn, setMatureOptIn] = React.useState(initial.matureOptIn);
  const [preferredLanguages, setPreferredLanguages] = React.useState<string[]>(initial.preferredLanguages || []);
  const [blockedGenreIds, setBlockedGenreIds] = React.useState<string[]>(initial.blockedGenreIds || []);
  const [blockedWarningIds, setBlockedWarningIds] = React.useState<string[]>(initial.blockedWarningIds || []);

  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  function toggleLang(code: string) {
    setPreferredLanguages((prev) => (prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]));
  }

  async function save() {
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matureOptIn,
          preferredLanguages,
          blockedGenreIds,
          blockedWarningIds,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setMsg("Saved!");
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 grid gap-4">
      {err ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">
          {err}
        </div>
      ) : null}
      {msg ? (
        <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/40 p-4 text-sm">
          {msg}
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">NSFW / Mature content opt-in</div>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={matureOptIn} onChange={(e) => setMatureOptIn(e.target.checked)} />
            <span className="text-sm font-semibold">Enable</span>
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div>
          <div className="text-sm font-semibold">Preferred languages</div>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            Used as default filter in Search (can be overridden per search).
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_CATALOG.map((l) => {
            const on = preferredLanguages.includes(l.code);
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => toggleLang(l.code)}
                className={
                  "px-3 py-1.5 rounded-xl text-sm border transition " +
                  (on
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800")
                }
              >
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      <MultiSelectPicker
        title="Blocked genres"
        subtitle="Works in this genre will be automatically hidden (unless you click 'Ignore my blocking' in Search)."
        items={genres}
        selectedIds={blockedGenreIds}
        onChange={setBlockedGenreIds}
      />

      <MultiSelectPicker
        title="Blocked warnings"
        subtitle="Works with this warning will be automatically hidden (unless you click 'Ignore my blocking' in Search)."
        items={warnings}
        selectedIds={blockedWarningIds}
        onChange={setBlockedWarningIds}
      />

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="px-5 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
