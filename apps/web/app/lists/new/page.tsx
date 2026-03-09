import BackButton from "@/app/components/BackButton";
import NewListForm from "./newListForm";

export const dynamic = "force-dynamic";

export default function NewListPage() {
  return (
    <main className="min-h-[calc(100vh-96px)] bg-white text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">New Collection</h1>
          </div>
          <BackButton href="/lists" />
        </div>

        <div className="mt-6">
          <NewListForm />
        </div>
      </div>
    </main>
  );
}
