"use client";

import * as React from "react";

type ReportRow = {
  id: string;
  title: string;
  message: string;
  pageUrl: string | null;
  status: string;
  createdAt: string;
  reporterReadAt?: string | null;
  adminReadAt?: string | null;
  reporter?: { id: string; name: string | null; username: string | null; email: string; image: string | null };
};

export default function AdminReportClient({ initialIsAdmin }: { initialIsAdmin: boolean }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [okMsg, setOkMsg] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<ReportRow[]>([]);
  const [isAdmin, setIsAdmin] = React.useState(initialIsAdmin);

  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [pageUrl, setPageUrl] = React.useState("");

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin-report");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed");
      setRows(Array.isArray(json?.reports) ? json.reports : []);
      setIsAdmin(!!json?.isAdmin);
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setErr(null);
    setOkMsg(null);
    if (!title.trim()) return setErr("Title wajib diisi.");
    if (!message.trim()) return setErr("Message wajib diisi.");

    setLoading(true);
    try {
      const res = await fetch("/api/admin-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          pageUrl: pageUrl.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Failed");
      setOkMsg("Terkirim!");
      setTitle("");
      setMessage("");
      setPageUrl("");
      await load();
    } catch (e: any) {
      setErr(e?.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 grid gap-4">
      {err ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/60 dark:bg-red-950/40 p-4 text-sm">{err}</div>
      ) : null}
      {okMsg ? (
        <div className="rounded-2xl border border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/40 p-4 text-sm">{okMsg}</div>
      ) : null}

      {!isAdmin ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 grid gap-3">
          <div className="text-sm font-semibold">Kirim report ke admin</div>
          <div className="grid gap-1">
            <label className="text-sm font-semibold">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder="Contoh: Bug login, chapter gak bisa dibuka, dll"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-semibold">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm min-h-[120px]"
              placeholder="Jelasin masalahnya + langkah buat reproduce."
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm font-semibold">Link (opsional)</label>
            <input
              value={pageUrl}
              onChange={(e) => setPageUrl(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm"
              placeholder="https://inkura.../work/xxx"
            />
          </div>
          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={loading}
              onClick={submit}
              className="px-5 py-3 rounded-xl text-white font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-110 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{isAdmin ? "Inbox reports" : "My reports"}</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">Latest 100</div>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          {rows.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-300">No reports yet.</div>
          ) : (
            rows.map((r) => {
              const unread = isAdmin ? !r.adminReadAt : false;
              return (
                <div
                  key={r.id}
                  className={
                    "rounded-2xl border p-4 transition " +
                    (unread
                      ? "border-purple-200 dark:border-purple-900 bg-purple-50/60 dark:bg-purple-950/30"
                      : "border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/40")
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={(unread ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200") + " font-semibold break-words"}>
                        {r.title}
                      </div>
                      <div className={(unread ? "" : "opacity-70") + " mt-1 text-xs text-gray-600 dark:text-gray-300"}>
                        {new Date(r.createdAt).toLocaleString()} • {r.status}
                        {isAdmin && r.reporter ? <> • {r.reporter.username || r.reporter.name || r.reporter.email}</> : null}
                      </div>
                    </div>
                  </div>
                  <div className={(unread ? "" : "text-gray-600 dark:text-gray-300") + " mt-3 text-sm whitespace-pre-wrap break-words"}>
                    {r.message}
                  </div>
                  {r.pageUrl ? (
                    <div className="mt-2 text-sm">
                      <a className="text-blue-600 dark:text-blue-400 hover:underline break-all" href={r.pageUrl} target="_blank" rel="noreferrer">
                        {r.pageUrl}
                      </a>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
