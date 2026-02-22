import { requireAdmin } from "@/server/auth/requireUser";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export const runtime = "nodejs";

export default async function AdminTagsPage() {
  await requireAdmin();
  return <TaxonomyManager kind="tags" title="Tags" />;
}
