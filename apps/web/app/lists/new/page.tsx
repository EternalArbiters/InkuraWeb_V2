import BackButton from "@/app/components/BackButton";
import { getActiveUILanguageText } from "@/server/services/uiLanguage/runtime";
import NewListForm from "./newListForm";
import ListSurface from "@/app/components/ListSurface";

export const dynamic = "force-dynamic";

export default async function NewListPage() {
  const tNewCollection = await getActiveUILanguageText("New Collection");
  return (
    <ListSurface>
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">{tNewCollection}</h1>
          </div>
          <BackButton href="/lists" />
        </div>

        <div className="mt-6">
          <NewListForm />
        </div>
      </div>
    </ListSurface>
  );
}
