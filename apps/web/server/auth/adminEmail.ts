import "server-only";

// v14: Only this email can be ADMIN.
export const ADMIN_EMAIL = "noelephgoddess.game@gmail.com";

export function isAdminEmail(email?: string | null): boolean {
  return (email || "").toLowerCase() === ADMIN_EMAIL;
}

export function enforcedRoleFromEmail(email?: string | null): "ADMIN" | "USER" {
  return isAdminEmail(email) ? "ADMIN" : "USER";
}
