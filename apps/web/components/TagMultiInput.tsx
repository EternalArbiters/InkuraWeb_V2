"use client";

import * as React from "react";

import { useUILanguageText } from "@/app/components/ui-language/UILanguageProvider";

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
  placeholder = "Type a tag then press Enter (or choose a suggestion) ...",
  maxTags = 50,
}: Props) {
  const t = useUILanguageText();
  const [input, setInput] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<{ name: string }[]>([]);
  const [loading, setLoading] = React.useState(false);

  const current = React.useMemo(() => value || [], [value]);

  const canAdd = current.length < maxTags;
  const translatedLabel = t(label);
  const translatedPlaceholder = t(placeholder);

  const addTag = React.useCallback(
    (raw: string) => {
      const nextTag = normalizeTag(raw);
      if (!nextTag) return;
      if (!canAdd) return;
      if (current.some((item) => item.toLowerCase() === nextTag.toLowerCase())) return;
      onChange([...current, nextTag]);
    },
    [canAdd, current, onChange],
  );

  function removeTag(tagName: string) {
    onChange(current.filter((item) => item !== tagName));
  }

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
        setSuggestions(tags.map((item: any) => ({ name: String(item.name || "") })).filter((item: any) => item.name));
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
        <div className="text-sm font-semibold">{translatedLabel}</div>
        <div className="text-xs text-gray-600 dark:text-gray-300">
          {current.length}/{maxTags}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {current.map((tagName) => {
          const removeLabel = `${t("Remove tag")} ${tagName}`;
          return (
            <span
              key={tagName}
              className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              #{tagName}
              <button
                type="button"
                onClick={() => removeTag(tagName)}
                className="text-gray-500 hover:text-red-500"
                aria-label={removeLabel}
                title={removeLabel}
              >
                
              </button>
            </span>
          );
        })}
      </div>

      <div className="mt-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={translatedPlaceholder}
          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
        />
        {loading ? (
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">{t("Looking for tag suggestions...")}</div>
        ) : null}
        {suggestions.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions
              .filter((suggestion) => !current.some((item) => item.toLowerCase() === suggestion.name.toLowerCase()))
              .slice(0, 12)
              .map((suggestion) => (
                <button
                  type="button"
                  key={suggestion.name}
                  onClick={() => {
                    addTag(suggestion.name);
                    setInput("");
                    setSuggestions([]);
                  }}
                  className="text-xs px-2 py-1 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  + {suggestion.name}
                </button>
              ))}
          </div>
        ) : null}
      </div>

      <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
        {t("Tip: press Enter or comma to add a tag.")}
      </div>
    </div>
  );
}
