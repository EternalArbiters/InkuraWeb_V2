"use client";

import * as React from "react";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";
import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";

type CreatorRole = "READER" | "AUTHOR" | "TRANSLATOR" | "UPLOADER";

type Props = {
  genres: PickerItem[];
  warnings: PickerItem[];
  initial: {
    adultConfirmed?: boolean;
    matureOptIn: boolean;
    creatorRole?: CreatorRole;
    preferredLanguages: string[];
    blockedGenreIds: string[];
    blockedWarningIds: string[];
  };
};

export default function PreferencesForm({ genres, warnings, initial }: Props) {
  const adultAlreadyConfirmed = !!initial.adultConfirmed;

  const [adultConfirmed, setAdultConfirmed] = React.useState(!!initial.adultConfirmed);
  const [matureOptIn, setMatureOptIn] = React.useState(initial.matureOptIn);
  const [creatorRole, setCreatorRole] = React.useState<CreatorRole>((initial.creatorRole as CreatorRole) || "READER");

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
          adultConfirmed,
          matureOptIn,
          creatorRole,
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

  const nsfwLocked = !adultConfirmed;

  return (
    <div className="mt-6 grid gap-4">
      {err ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">{err}</div>
      ) : null}
      {msg ? (
        <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/40 p-4 text-sm">{msg}</div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div className="text-sm font-semibold">Creator role</div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          Pilih satu role untuk Studio. Reader tetap bisa baca semua konten non-mature.
        </div>

        <label className="text-sm font-semibold">
          Role
          <select
            value={creatorRole}
            onChange={(e) => setCreatorRole(e.target.value as CreatorRole)}
            className="mt-2 w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
          >
            <option value="READER">Reader (default)</option>
            <option value="AUTHOR">Author (Original)</option>
            <option value="TRANSLATOR">Translator (Translation)</option>
            <option value="UPLOADER">Uploader (Reupload)</option>
          </select>
        </label>

        <div className="text-[11px] text-gray-600 dark:text-gray-300">
          * Author hanya bisa bikin <b>Original</b>. Translator hanya bisa bikin <b>Translation</b> (wajib credit + source). Uploader hanya bisa bikin <b>Reupload</b> (wajib source).
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div className="text-sm font-semibold">Mature content</div>
        <div className="text-xs text-gray-600 dark:text-gray-300">Default terkunci. Kamu harus konfirmasi 18+ dulu.</div>

        <label className={`flex items-center gap-2 ${adultAlreadyConfirmed ? "opacity-80" : ""}`}>
          <input
            type="checkbox"
            checked={adultConfirmed}
            disabled={adultAlreadyConfirmed}
            onChange={(e) => {
              const next = e.target.checked;
              setAdultConfirmed(next);
              if (!next) setMatureOptIn(false);
            }}
          />
          <span className="text-sm font-semibold">I am 18+ (unlock)</span>
        </label>

        {adultAlreadyConfirmed ? (
          <div className="text-[11px] text-gray-600 dark:text-gray-300">Sudah di-unlock dan tidak bisa dimatikan lagi.</div>
        ) : null}

        <label className={`flex items-center gap-2 ${nsfwLocked ? "opacity-50" : ""}`}>
          <input
            type="checkbox"
            disabled={nsfwLocked}
            checked={nsfwLocked ? false : matureOptIn}
            onChange={(e) => setMatureOptIn(e.target.checked)}
          />
          <span className="text-sm font-semibold">Include mature works</span>
        </label>

        {nsfwLocked ? <div className="text-xs text-yellow-700 dark:text-yellow-300">Locked until you confirm you are 18+.</div> : null}
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div>
          <div className="text-sm font-semibold">Preferred languages</div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Dipakai sebagai default filter di Search (bisa override per search).</div>
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
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
