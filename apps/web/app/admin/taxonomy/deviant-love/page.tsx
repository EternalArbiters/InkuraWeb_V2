import { requireAdmin } from "@/server/auth/requireUser";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export const runtime = "nodejs";

export default async function AdminDeviantLovePage() {
  await requireAdmin();
  return <TaxonomyManager kind="deviant-love-tags" title="Deviant Love Tags" />;
}
