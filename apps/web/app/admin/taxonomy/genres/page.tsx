import { requireAdmin } from "@/server/auth/requireUser";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export const runtime = "nodejs";

export default async function AdminGenresPage() {
  await requireAdmin();
  return <TaxonomyManager kind="genres" title="Genres" />;
}
