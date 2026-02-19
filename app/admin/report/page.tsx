"use client";

import { useEffect, useState } from "react";

type ReportItem = {
  id: string;
  message: string;
  status: string;
  createdAt: string;
  reporter: {
    email: string;
    username: string;
    name: string | null;
  };
};

export default function AdminReportListPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Gagal load report");
        return;
      }
      setReports(data.reports || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen pt-28 px-4 md:px-6 max-w-5xl mx-auto">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Reports (Admin)</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Ini daftar report dari user.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200"
        >
          Refresh
        </button>
      </div>

      {loading && <div className="text-sm text-gray-600 dark:text-gray-300">Loading...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="grid gap-4">
          {reports.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm text-gray-600 dark:text-gray-300">
              Belum ada report.
            </div>
          ) : (
            reports.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {r.reporter?.name || r.reporter?.username} ({r.reporter?.email})
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(r.createdAt).toLocaleString()} • Status: {r.status}
                    </div>
                  </div>
                </div>

                <div className="mt-3 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
                  {r.message}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </main>
  );
}
