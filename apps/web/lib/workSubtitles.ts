export function normalizeWorkSubtitleEntry(raw: unknown) {
  const value = String(raw ?? "").trim();
  if (!value) return null;
  return value.slice(0, 200);
}

export function normalizeWorkSubtitles(raw: unknown): string[] {
  const input = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of input) {
    const normalized = normalizeWorkSubtitleEntry(item);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= 5) break;
  }

  return result;
}

export function parseWorkSubtitles(rawJson: unknown, fallbackSingle?: unknown): string[] {
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

  const subtitles = normalizeWorkSubtitles(parsed);
  if (subtitles.length) return subtitles;
  return normalizeWorkSubtitles(fallbackSingle);
}

export function serializeWorkSubtitles(raw: unknown, fallbackSingle?: unknown) {
  const subtitles = normalizeWorkSubtitles(raw);
  if (subtitles.length) return JSON.stringify(subtitles);
  return JSON.stringify(normalizeWorkSubtitles(fallbackSingle));
}
