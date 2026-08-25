import "server-only";

// v14: Only this email can be ADMIN.
export const ADMIN_EMAIL = "noelephgoddess.game@gmail.com";

export function isAdminEmail(email?: string | null): boolean {
  return (email || "").toLowerCase() === ADMIN_EMAIL;
}

// v30: Reconciles a role against the hardcoded admin email WITHOUT stomping other
// non-ADMIN roles (e.g. SPECIAL_USER) back to USER. Only the admin email is ever
// force-asserted; every other email keeps whatever role is already known.
export function reconcileRole(
  email: string | null | undefined,
  currentRole: string | null | undefined
): "ADMIN" | "USER" | "SPECIAL_USER" {
  if (isAdminEmail(email)) return "ADMIN";
  if (currentRole === "SPECIAL_USER") return "SPECIAL_USER";
  return "USER";
}

// Back-compat shim for call sites that have no prior role to preserve
// (e.g. brand-new self-registration). Equivalent to reconcileRole(email, null).
export function enforcedRoleFromEmail(email?: string | null): "ADMIN" | "USER" {
  return reconcileRole(email, null) as "ADMIN" | "USER";
}
