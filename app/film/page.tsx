import WorkList from "@/app/components/WorkList";

export default function FilmPage() {
  return (
    <main className="min-h-screen pt-28 px-4 md:px-6 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Film</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        Film NSFW tidak akan muncul kalau belum 18+.
      </p>
      <WorkList type="FILM" />
    </main>
  );
}
