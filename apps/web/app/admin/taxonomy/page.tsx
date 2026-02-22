import { redirect } from "next/navigation";

export const runtime = "nodejs";

export default function AdminTaxonomyIndex() {
  redirect("/admin/taxonomy/genres");
}
