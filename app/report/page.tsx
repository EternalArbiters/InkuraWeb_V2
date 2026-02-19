"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReportPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setError(null);
    setOk(false);

    if (!message.trim()) {
      setError("Isi report wajib");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Gagal mengirim report");
        return;
      }

      setOk(true);
      setMessage("");
    } finally {
      setSending(false);
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen pt-28 px-4 md:px-6 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Admin Report</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 mb-6">
        Tulis report untuk admin. Contoh: bug login, karya melanggar, link rusak, dsb.
      </p>

      <div className="rounded-2xl bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-800 p-6">
        <label className="text-sm font-semibold text-gray-900 dark:text-white">Isi report</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-2 w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white min-h-[160px]"
          placeholder="Jelaskan masalahnya secara jelas..."
        />

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        {ok && <div className="mt-3 text-sm text-green-600">Report terkirim ✅</div>}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white font-semibold disabled:opacity-60"
          >
            {sending ? "Mengirim..." : "Kirim"}
          </button>
        </div>
      </div>

      <p className="mt-5 text-xs text-gray-500 dark:text-gray-400">
        Catatan: kalau kamu admin, halaman list report ada di <span className="font-semibold">/admin/report</span>.
      </p>
    </main>
  );
}
