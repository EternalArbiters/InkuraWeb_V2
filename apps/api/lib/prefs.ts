export function parseJsonStringArray(v: unknown): string[] {
  if (typeof v !== "string") return [];
  try {
    const parsed = JSON.parse(v);
    if (Array.isArray(parsed)) return parsed.map(String).map((s) => s.trim()).filter(Boolean);
  } catch {
    // ignore
  }
  return [];
}

export function stringifyJsonStringArray(v: string[]): string {
  const unique = Array.from(new Set((v || []).map((s) => String(s).trim()).filter(Boolean)));
  return JSON.stringify(unique);
}
