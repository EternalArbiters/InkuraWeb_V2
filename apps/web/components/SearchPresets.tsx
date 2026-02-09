"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Preset = { name: string; query: string; createdAt: number };

function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem("inkura:searchPresets");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}

function savePresets(p: Preset[]) {
  try {
    localStorage.setItem("inkura:searchPresets", JSON.stringify(p.slice(0, 30)));
  } catch {}
}

export default function SearchPresets() {
  const pathname = usePathname();
  const sp = useSearchParams();
  const currentQuery = sp.toString();

  const [presets, setPresets] = React.useState<Preset[]>([]);
  const [name, setName] = React.useState("");

  React.useEffect(() => {
    setPresets(loadPresets());
  }, []);

  function add() {
    const n = name.trim();
    if (!n) return;
    const p: Preset = { name: n, query: currentQuery, createdAt: Date.now() };
    const next = [p, ...presets.filter((x) => x.name !== n)];
    setPresets(next);
    savePresets(next);
    setName("");
  }

  function del(n: string) {
    const next = presets.filter((x) => x.name !== n);
    setPresets(next);
    savePresets(next);
  }

  if (!pathname?.startsWith("/search")) return null;

  return (
    <div className="mt-6 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="text-sm font-semibold">Saved Presets</div>

      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Preset name..."
          className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="button"
          onClick={add}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:brightness-110"
        >
          Save
        </button>
      </div>

      {presets.length ? (
        <div className="mt-4 grid gap-2">
          {presets.map((p) => (
            <div key={p.name} className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2">
              <a
                className="flex-1 text-sm hover:underline"
                href={`/search?${p.query}`}
                title={p.query}
              >
                {p.name}
              </a>
              <button
                type="button"
                onClick={() => del(p.name)}
                className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">There are no presets yet.</div>
      )}
    </div>
  );
}
