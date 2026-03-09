"use client";

export default function WorkArcFields({
  seriesTitle,
  setSeriesTitle,
  seriesOrder,
  setSeriesOrder,
}: {
  seriesTitle: string;
  setSeriesTitle: (v: string) => void;
  seriesOrder: string;
  setSeriesOrder: (v: string) => void;
}) {
  return (
    <div className="grid gap-4 rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
      <div>
        <div className="text-sm font-semibold">Series</div>
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          Pakai judul series yang sama di karya terkait, lalu atur urutan arc di sini atau lewat Manage Series.
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-semibold">Series title</span>
          <input
            value={seriesTitle}
            onChange={(e) => setSeriesTitle(e.target.value)}
            placeholder="Example: The Eruption Saga"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-semibold">Arc order</span>
          <input
            value={seriesOrder}
            onChange={(e) => setSeriesOrder(e.target.value.replace(/[^0-9]/g, ""))}
            inputMode="numeric"
            placeholder="1"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
          />
        </label>
      </div>
    </div>
  );
}
