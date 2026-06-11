"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type UserResult = {
  id: string;
  username: string | null;
  name: string | null;
  image: string | null;
};

type Props = {
  asUser?: { id: string; username: string | null; name: string | null } | null;
};

export default function AdminStudioSwitcher({ asUser }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<UserResult[]>([]);
  const [searching, setSearching] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.users || []);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [query]);

  function selectUser(user: UserResult) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/studio?asUser=${user.id}`);
  }

  function exitUserStudio() {
    router.push("/studio");
  }

  if (asUser) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 px-4 py-2.5 text-sm">
        <span className="text-amber-700 dark:text-amber-300 font-medium">
          Studio: <strong>{asUser.name || asUser.username || asUser.id}</strong>
          {asUser.username && <span className="font-normal opacity-70"> @{asUser.username}</span>}
        </span>
        <button
          type="button"
          onClick={exitUserStudio}
          className="ml-auto text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
        >
          Keluar
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm font-semibold"
        >
          Studio user
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari username..."
              className="w-56 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            {(results.length > 0 || searching) && (
              <div className="absolute top-full left-0 z-50 mt-1 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl overflow-hidden">
                {searching && <div className="px-3 py-2 text-xs text-gray-400">Mencari...</div>}
                {results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectUser(u)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <div className="h-7 w-7 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold">
                      {u.image
                        ? <img src={u.image} alt="" className="h-full w-full object-cover" />
                        : (u.name || u.username || "?").slice(0, 1).toUpperCase()
                      }
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{u.name || u.username}</div>
                      {u.username && <div className="text-xs text-gray-500">@{u.username}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setOpen(false); setQuery(""); setResults([]); }}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-semibold"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
}
