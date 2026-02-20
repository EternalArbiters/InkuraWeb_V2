import Link from "next/link";
import PageScaffold from "../components/PageScaffold";

export default function UploadPage() {
  return (
    <PageScaffold
      title="⬆ Upload"
      description="Upload sudah pindah ke Creator Studio (Work → Chapter → isi teks/pages)."
      crumbs={[
        { label: "Home", href: "/home" },
        { label: "Upload", href: "/upload" },
      ]}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
          <h2 className="text-xl font-bold">Creator Studio</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Buat Work (NOVEL/COMIC), bikin Chapter, lalu upload: teks untuk novel atau images untuk comic.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/studio"
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold bg-gradient-to-r from-blue-500 via-pink-500 to-purple-600 text-white hover:brightness-110"
            >
              Buka Studio
            </Link>
            <Link
              href="/studio/new"
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Create New Work
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/50 p-6">
          <h2 className="text-xl font-bold">Reader</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Reader mendukung NOVEL (text) dan COMIC (vertical pages).
          </p>
          <div className="mt-4">
            <Link
              href="/all"
              className="inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Explore
            </Link>
          </div>
        </div>
      </div>
    </PageScaffold>
  );
}
