import { requireAdmin } from "@/server/auth/requireUser";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export const runtime = "nodejs";

export default async function AdminWarningsPage() {
  await requireAdmin();
  return <TaxonomyManager kind="warning-tags" title="Warning Tags" />;
}
