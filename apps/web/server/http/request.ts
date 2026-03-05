import "server-only";

/**
 * Safe JSON body helpers for Request.
 * Many existing routes used `req.json().catch(() => ({}))`; these helpers keep the same behavior.
 */
export async function readJson(req: Request): Promise<any> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function readJsonObject(req: Request): Promise<Record<string, any>> {
  const v = await readJson(req);
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  return v as Record<string, any>;
}



export function asString(v: any) {
  return typeof v === "string" ? v.trim() : "";
}

export function asOptionalBool(v: any): boolean | undefined {
  if (v === true || v === false) return v;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    if (t === "true" || t === "1" || t === "yes") return true;
    if (t === "false" || t === "0" || t === "no") return false;
  }
  return undefined;
}

export function toJsonSafe(value: any) {
  if (value == null) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}
export function getClientMeta(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = req.headers.get("user-agent") || null;
  return { ip, userAgent };
}
