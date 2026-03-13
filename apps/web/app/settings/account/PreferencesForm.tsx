"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";
import { normalizeInkuraLanguage, type InkuraLanguageCode } from "@/lib/inkuraLanguage";

import AdultConfirmCard from "./components/preferences/AdultConfirmCard";
import ConfirmAdultDialog from "./components/preferences/ConfirmAdultDialog";
import ConfirmDeviantLoveDialog from "./components/preferences/ConfirmDeviantLoveDialog";
import DeviantLoveCard from "./components/preferences/DeviantLoveCard";
import InkuraLanguageCard from "./components/preferences/InkuraLanguageCard";
import PreferenceAlerts from "./components/preferences/PreferenceAlerts";
import PreferredLanguagesCard from "./components/preferences/PreferredLanguagesCard";

type TaxonomyOption = {
  id: string;
  name: string;
  slug?: string;
};

type Prefs = {
  adultConfirmed: boolean;
  deviantLoveConfirmed: boolean;
  inkuraLanguage: InkuraLanguageCode | null;
  preferredLanguages: string[];
  blockedGenreIds?: string[];
  blockedWarningIds?: string[];
  blockedDeviantLoveIds?: string[];
};

type PreferencesFormProps = {
  initial: Prefs;
  genres?: TaxonomyOption[];
  warnings?: TaxonomyOption[];
  deviantLoveTags?: TaxonomyOption[];
};

export default function PreferencesForm({ initial }: PreferencesFormProps) {
  const { update } = useSession();
  const t = useUILanguageText("Page Settings Account");
  const tForms = useUILanguageText("Shared Forms");
  const tErrors = useUILanguageText("Shared Errors");
  const [adultConfirmed, setAdultConfirmed] = React.useState(!!initial.adultConfirmed);
  const [deviantLoveConfirmed, setDeviantLoveConfirmed] = React.useState(!!initial.deviantLoveConfirmed);
  const [inkuraLanguage, setInkuraLanguage] = React.useState<InkuraLanguageCode | null>(
    normalizeInkuraLanguage(initial.inkuraLanguage)
  );
  const [preferredLanguages, setPreferredLanguages] = React.useState<string[]>(initial.preferredLanguages || []);

  const [confirmAdultOpen, setConfirmAdultOpen] = React.useState(false);
  const [confirmDeviantOpen, setConfirmDeviantOpen] = React.useState(false);

  const [saving, setSaving] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const toggleLang = (code: string) => {
    setPreferredLanguages((prev) => (prev.includes(code) ? prev.filter((x) => x !== code) : [...prev, code]));
  };

  const handleSave = async () => {
    setSaving(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adultConfirmed, deviantLoveConfirmed, inkuraLanguage, preferredLanguages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || tErrors("Failed to save"));
      await update();
      setMsg(tForms("Saved"));
    } catch (e: any) {
      setErr(String(e?.message || e || tErrors("Failed")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PreferenceAlerts err={err} msg={msg} />

      <AdultConfirmCard
        adultConfirmed={adultConfirmed}
        onChange={(checked) => {
          if (checked && !adultConfirmed) {
            setConfirmAdultOpen(true);
          } else {
            if (!checked) setDeviantLoveConfirmed(false);
            setAdultConfirmed(checked);
          }
        }}
      />

      <DeviantLoveCard
        adultConfirmed={adultConfirmed}
        deviantLoveConfirmed={deviantLoveConfirmed}
        onChange={(checked) => {
          if (checked && !deviantLoveConfirmed) {
            setConfirmDeviantOpen(true);
          } else {
            setDeviantLoveConfirmed(checked);
          }
        }}
      />

      <PreferredLanguagesCard preferredLanguages={preferredLanguages} onToggle={toggleLang} />

      <InkuraLanguageCard inkuraLanguage={inkuraLanguage} onChange={setInkuraLanguage} />

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? tForms("Saving…") : tForms("Save")}
        </Button>
      </div>

      <ConfirmAdultDialog
        open={confirmAdultOpen}
        setOpen={setConfirmAdultOpen}
        onConfirm={() => {
          setAdultConfirmed(true);
          setConfirmAdultOpen(false);
        }}
      />

      <ConfirmDeviantLoveDialog
        open={confirmDeviantOpen}
        setOpen={setConfirmDeviantOpen}
        onConfirm={() => {
          setDeviantLoveConfirmed(true);
          setConfirmDeviantOpen(false);
        }}
      />
    </div>
  );
}
