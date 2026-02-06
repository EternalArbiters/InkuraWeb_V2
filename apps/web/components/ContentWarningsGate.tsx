"use client";

import * as React from "react";

type Warning = { id?: string; name: string; slug?: string };

type Props = {
  storageKey: string;
  title: string;
  warnings: Warning[];
  children: React.ReactNode;
};

export default function ContentWarningsGate({ storageKey, title, warnings, children }: Props) {
  const [ok, setOk] = React.useState(false);

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(`inkura:ack:${storageKey}`);
      if (v === "1") setOk(true);
    } catch {}
  }, [storageKey]);

  const hasWarnings = warnings && warnings.length > 0;
  if (!hasWarnings || ok) return <>{children}</>;

  return (
    <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30 p-6">
      <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">Content Warning</div>
      <div className="mt-1 text-2xl font-bold">{title}</div>
      <div className="mt-3 text-sm text-amber-900/80 dark:text-amber-100/80">
        Konten ini ditandai memiliki peringatan:
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {warnings.map((w) => (
          <span
            key={w.slug || w.name}
            className="text-xs px-2 py-1 rounded-full bg-white/80 dark:bg-black/20 border border-amber-200 dark:border-amber-900"
          >
            {w.name}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:brightness-110"
          onClick={() => {
            try {
              localStorage.setItem(`inkura:ack:${storageKey}`, "1");
            } catch {}
            setOk(true);
          }}
        >
          Saya Mengerti, Lanjut
        </button>
        <a
          href="/search"
          className="px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-900 hover:bg-white/60 dark:hover:bg-black/10 text-sm text-amber-900 dark:text-amber-100"
        >
          Kembali ke Search
        </a>
      </div>

      <div className="mt-3 text-xs text-amber-900/70 dark:text-amber-100/70">
        Catatan: persetujuan disimpan per halaman di browser ini.
      </div>
    </div>
  );
}
