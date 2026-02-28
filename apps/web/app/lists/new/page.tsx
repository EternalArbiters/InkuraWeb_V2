import Link from "next/link";
import NewListForm from "./newListForm";

export const dynamic = "force-dynamic";

export default function NewListPage() {
  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">New Reading List</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Buat koleksi: private atau public (bisa dibagikan).</p>
          </div>
          <Link href="/lists" className="text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline">
            Back
          </Link>
        </div>

        <div className="mt-6">
          <NewListForm />
        </div>
      </div>
    </main>
  );
}
