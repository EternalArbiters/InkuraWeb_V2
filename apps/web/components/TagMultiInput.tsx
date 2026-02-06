"use client";

import * as React from "react";

type Props = {
  label?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxTags?: number;
};

function normalizeTag(name: string) {
  return name
    .trim()
    .replace(/^#+/, "")
    .replace(/\s+/g, " ");
}

export default function TagMultiInput({
  label = "Tags",
  value,
  onChange,
  placeholder = "Ketik tag lalu Enter (atau pilih saran) ...",
  maxTags = 50,
}: Props) {
  const [input, setInput] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<{ name: string }[]>([]);
  const [loading, setLoading] = React.useState(false);

  const current = React.useMemo(() => value || [], [value]);

  const canAdd = current.length < maxTags;

  const addTag = React.useCallback(
    (raw: string) => {
      const t = normalizeTag(raw);
      if (!t) return;
      if (!canAdd) return;
      if (current.some((x) => x.toLowerCase() === t.toLowerCase())) return;
      onChange([...current, t]);
    },
    [canAdd, current, onChange],
  );

  function removeTag(t: string) {
    onChange(current.filter((x) => x !== t));
  }

  // Fetch suggestions (debounced)
  React.useEffect(() => {
    const q = input.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    const handle = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/tags?q=${encodeURIComponent(q)}&take=12`);
        const data = await res.json().catch(() => ({} as any));
        const tags = Array.isArray(data?.tags) ? data.tags : [];
        setSuggestions(tags.map((t: any) => ({ name: String(t.name || "") })).filter((t: any) => t.name));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(handle);
  }, [input]);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
      setInput("");
      setSuggestions([]);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          {current.length}/{maxTags}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {current.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            #{t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="text-gray-500 hover:text-red-500"
              aria-label={`Remove tag ${t}`}
            >
              
            </button>
          </span>
        ))}
      </div>

      <div className="mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
        />
        {loading ? (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">Looking for tag suggestions...</div>
        ) : null}
        {suggestions.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions
              .filter((s) => !current.some((x) => x.toLowerCase() === s.name.toLowerCase()))
              .slice(0, 12)
              .map((s) => (
                <button
                  type="button"
                  key={s.name}
                  onClick={() => {
                    addTag(s.name);
                    setInput("");
                    setSuggestions([]);
                  }}
                  className="text-xs px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  + {s.name}
                </button>
              ))}
          </div>
        ) : null}
      </div>

      <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
        Tips: tekan <b>Enter</b> atau koma untuk menambah.
      </div>
    </div>
  );
}
