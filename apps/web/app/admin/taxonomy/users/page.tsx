import AdminUsersClient from "./AdminUsersClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
