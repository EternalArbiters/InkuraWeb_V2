"use client";

export default function ChapterCoverCard({
  thumbnailImage,
  loading,
  onClear,
}: {
  thumbnailImage: string | null;
  loading: boolean;
  onClear: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-semibold">Chapter cover</div>
          <div className="text-xs text-gray-600 dark:text-gray-300">
            Dipakai untuk thumbnail di list chapter.
          </div>
        </div>
        {thumbnailImage ? (
          <button
            type="button"
            onClick={onClear}
            disabled={loading}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 disabled:opacity-60"
          >
            Clear
          </button>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-[96px_1fr] gap-3 items-start">
        <div className="relative aspect-[4/3] border border-gray-200 dark:border-gray-800 bg-black/5 dark:bg-white/5 overflow-hidden">
          {thumbnailImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={thumbnailImage}
              alt="chapter thumb"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
              Auto
            </div>
          )}
        </div>
        <div className="text-sm text-gray-700 dark:text-gray-200">
          {thumbnailImage ? (
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Cover sudah dipilih. Atur posisi/zoom di halaman Edit Chapter.
            </div>
          ) : (
            <div className="text-xs text-gray-600 dark:text-gray-300">
              Belum pilih cover. Sistem akan ambil otomatis dari halaman chapter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
