export type ProfileLinkEntry = {
  title: string;
  url: string;
};

const MAX_PROFILE_LINKS = 5;
const MAX_PROFILE_LINK_TITLE = 60;

export function displayUrlLabel(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function normalizeProfileLinkTitle(raw: unknown, url: string) {
  const value = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (value) return value.slice(0, MAX_PROFILE_LINK_TITLE);
  return displayUrlLabel(url).slice(0, MAX_PROFILE_LINK_TITLE);
}

function normalizeProfileUrlEntry(raw: unknown) {
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

export function normalizeProfileLink(raw: unknown): ProfileLinkEntry | null {
  if (typeof raw === "string") {
    const url = normalizeProfileUrlEntry(raw);
    if (!url) return null;
    return {
      title: normalizeProfileLinkTitle("", url),
      url,
    };
  }

  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as {
    title?: unknown;
    label?: unknown;
    name?: unknown;
    url?: unknown;
    href?: unknown;
  };
  const url = normalizeProfileUrlEntry(candidate.url ?? candidate.href);
  if (!url) return null;

  return {
    title: normalizeProfileLinkTitle(candidate.title ?? candidate.label ?? candidate.name, url),
    url,
  };
}

export function normalizeProfileLinks(raw: unknown): ProfileLinkEntry[] {
  const input = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
  const result: ProfileLinkEntry[] = [];
  const seen = new Set<string>();

  for (const item of input) {
    const normalized = normalizeProfileLink(item);
    if (!normalized || seen.has(normalized.url)) continue;
    seen.add(normalized.url);
    result.push(normalized);
    if (result.length >= MAX_PROFILE_LINKS) break;
  }

  return result;
}

export function parseProfileLinks(rawJson: unknown, fallbackSingle?: unknown): ProfileLinkEntry[] {
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

  const links = normalizeProfileLinks(parsed);
  if (links.length) return links;
  return normalizeProfileLinks(fallbackSingle);
}

export function serializeProfileLinks(raw: unknown, fallbackSingle?: unknown) {
  const links = normalizeProfileLinks(raw);
  if (links.length) return JSON.stringify(links);
  return JSON.stringify(normalizeProfileLinks(fallbackSingle));
}

export function normalizeProfileUrls(raw: unknown): string[] {
  return normalizeProfileLinks(raw).map((entry) => entry.url);
}

export function parseProfileUrls(rawJson: unknown, fallbackSingle?: unknown): string[] {
  return parseProfileLinks(rawJson, fallbackSingle).map((entry) => entry.url);
}

export function serializeProfileUrls(raw: unknown, fallbackSingle?: unknown) {
  return JSON.stringify(normalizeProfileUrls(raw).length ? normalizeProfileLinks(raw) : normalizeProfileLinks(fallbackSingle));
}
