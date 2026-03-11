export function displayUrlLabel(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function normalizeProfileUrlEntry(raw: unknown) {
  const rawValue = String(raw ?? "").trim();
  if (!rawValue) return null;

  const withProtocol = /^https?:\/\//i.test(rawValue)
    ? rawValue
    : `https://${rawValue.replace(/^\/+/, "")}`;

  try {
    const parsed = new URL(withProtocol);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString().slice(0, 500);
  } catch {
    return null;
  }
}

export function normalizeProfileUrls(raw: unknown): string[] {
  const input = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of input) {
    const normalized = normalizeProfileUrlEntry(item);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= 5) break;
  }

  return result;
}

export function parseProfileUrls(rawJson: unknown, fallbackSingle?: unknown): string[] {
  let parsed: unknown[] = [];

  if (Array.isArray(rawJson)) {
    parsed = rawJson;
  } else if (typeof rawJson === "string" && rawJson.trim()) {
    try {
      const value = JSON.parse(rawJson);
      if (Array.isArray(value)) {
        parsed = value;
      }
    } catch {
      parsed = [];
    }
  }

  const urls = normalizeProfileUrls(parsed);
  if (urls.length) return urls;
  return normalizeProfileUrls(fallbackSingle);
}

export function serializeProfileUrls(raw: unknown, fallbackSingle?: unknown) {
  const urls = normalizeProfileUrls(raw);
  if (urls.length) return JSON.stringify(urls);
  return JSON.stringify(normalizeProfileUrls(fallbackSingle));
}
