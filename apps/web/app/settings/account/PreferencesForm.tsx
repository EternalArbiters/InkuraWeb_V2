"use client";

import * as React from "react";
import MultiSelectPicker, { PickerItem } from "@/components/MultiSelectPicker";
import { LANGUAGE_CATALOG } from "@/lib/languageCatalog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  genres: PickerItem[];
  warnings: PickerItem[];
  deviantLoveTags: PickerItem[];
  initial: {
    adultConfirmed?: boolean;
    deviantLoveConfirmed?: boolean;
    preferredLanguages: string[];
    blockedGenreIds: string[];
    blockedWarningIds: string[];
    blockedDeviantLoveIds: string[];
  };
};

export default function PreferencesForm({ genres, warnings, deviantLoveTags, initial }: Props) {
  const [adultConfirmed, setAdultConfirmed] = React.useState(!!initial.adultConfirmed);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const [deviantLoveConfirmed, setDeviantLoveConfirmed] = React.useState(!!initial.deviantLoveConfirmed);
  const [confirmDeviantOpen, setConfirmDeviantOpen] = React.useState(false);

  const [preferredLanguages, setPreferredLanguages] = React.useState<string[]>(initial.preferredLanguages || []);
  const [blockedGenreIds, setBlockedGenreIds] = React.useState<string[]>(initial.blockedGenreIds || []);
  const [blockedWarningIds, setBlockedWarningIds] = React.useState<string[]>(initial.blockedWarningIds || []);
  const [blockedDeviantLoveIds, setBlockedDeviantLoveIds] = React.useState<string[]>(initial.blockedDeviantLoveIds || []);

  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  function toggleLang(code: string) {
    setPreferredLanguages((prev) => (prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]));
  }

  async function save(next?: { adultConfirmed?: boolean; deviantLoveConfirmed?: boolean }) {
    const nextAdultConfirmed = typeof next?.adultConfirmed === "boolean" ? next.adultConfirmed : adultConfirmed;
    const nextDeviantConfirmed = typeof next?.deviantLoveConfirmed === "boolean" ? next.deviantLoveConfirmed : deviantLoveConfirmed;
    setErr(null);
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adultConfirmed: nextAdultConfirmed,
          deviantLoveConfirmed: nextDeviantConfirmed,
          preferredLanguages,
          blockedGenreIds,
          blockedWarningIds,
          blockedDeviantLoveIds,
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

  async function confirmAdult() {
    setConfirmOpen(false);
    setAdultConfirmed(true);
    await save({ adultConfirmed: true });
  }

  async function confirmDeviantLove() {
    setConfirmDeviantOpen(false);
    setDeviantLoveConfirmed(true);
    await save({ adultConfirmed, deviantLoveConfirmed: true });
  }

  return (
    <div className="mt-6 grid gap-4">
      {err ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">{err}</div>
      ) : null}
      {msg ? (
        <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/40 p-4 text-sm">{msg}</div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div className="text-sm font-semibold">Mature / 18+</div>


        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={adultConfirmed}
            onChange={(e) => {
              const next = e.target.checked;
              if (!next) {
                // lock again (allowed). No confirmation needed.
                setAdultConfirmed(false);
                // deviant love must lock too
                setDeviantLoveConfirmed(false);
                void save({ adultConfirmed: false, deviantLoveConfirmed: false });
                return;
              }
              // unlocking always requires confirmation (every time)
              setConfirmOpen(true);
            }}
          />
          <span className="text-sm font-semibold">I'm 18+ (Unlock it)</span>
        </label>


      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div className="text-sm font-semibold">Deviant Love</div>


        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={deviantLoveConfirmed}
            disabled={!adultConfirmed}
            onChange={(e) => {
              const next = e.target.checked;
              if (!adultConfirmed) return;
              if (!next) {
                setDeviantLoveConfirmed(false);
                void save({ adultConfirmed, deviantLoveConfirmed: false });
                return;
              }
              setConfirmDeviantOpen(true);
            }}
          />
          <span className={"text-sm font-semibold " + (!adultConfirmed ? "text-gray-400" : "")}>Unlock it</span>
        </label>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
        <div>
          <div className="text-sm font-semibold">Preferred languages</div>

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
        title="Blocked NSFW tags"
        subtitle="Works with this NSFW/sensitive tag will be automatically hidden (unless you click 'Ignore my blocking' in Search). (NSFW tags are locked unless you confirm 18+.)"
        items={warnings}
        selectedIds={blockedWarningIds}
        onChange={setBlockedWarningIds}
      />

      <MultiSelectPicker
        title="Blocked Deviant Love tags"
        subtitle="Works with this Deviant Love tag will be automatically hidden (unless you click 'Ignore my blocking' in Search). (Deviant Love tags are locked unless you unlock Deviant Love.)"
        items={deviantLoveTags}
        selectedIds={blockedDeviantLoveIds}
        onChange={setBlockedDeviantLoveIds}
      />

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => save()}
          disabled={loading}
          className="px-5 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Peringatan 18+</DialogTitle>
            <DialogDescription>
              Dengan mencentang kotak ini. Anda sudah setuju bahwa dosa anda ditanggung sendiri. Developer tidak bertanggung jawab
              ataupun berbagi dosa dengan apapun yang anda baca. Ini adalah peringatan terakhir. Bacaan anda selanjutnya penuh dosa~
              kami tidak akan ikut bertanggung jawab.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setConfirmOpen(false)}>
              Tidak, saya tidak mau.
            </Button>
            <Button type="button" onClick={confirmAdult}>
              Ya, saya tau itu.
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeviantOpen} onOpenChange={setConfirmDeviantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Peringatan Deviant Love</DialogTitle>
            <DialogDescription>
              Dengan membuka Deviant Love, kamu menyatakan sudah cukup umur dan siap menanggung konsekuensi dari konten bertema
              hubungan menyimpang. Anda sudah setuju bahwa dosa anda ditanggung sendiri. Developer tidak bertanggung jawab atas apa pun yang kamu baca. Ini adalah peringatan terakhir. Bacaan anda selanjutnya penuh dosa~
              kami tidak akan ikut bertanggung jawab.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setConfirmDeviantOpen(false)}>
              Tidak, saya tidak mau.
            </Button>
            <Button type="button" onClick={confirmDeviantLove}>
              Ya, saya mengerti.
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
