const BLOCK_TAG_RE = /<\/?[a-z][\s\S]*>/i;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function stripWrappingQuotes(value: string) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

function decodeBasicEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function sanitizeUrl(raw: string, kind: "href" | "src") {
  const value = stripWrappingQuotes(String(raw || "").trim());
  if (!value) return "";

  if (kind === "src" && /^data:image\//i.test(value)) return value;
  if (/^(https?:|\/)/i.test(value)) return value;
  return "";
}

export function isNovelHtml(value: string | null | undefined) {
  return BLOCK_TAG_RE.test(String(value || ""));
}

export function plainTextToNovelHtml(value: string | null | undefined) {
  const normalized = String(value || "")
    .replace(/\r\n?/g, "\n")
    .trim();

  if (!normalized) return "";

  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function sanitizeNovelHtml(value: string | null | undefined) {
  let html = String(value || "");
  if (!html.trim()) return "";

  if (!isNovelHtml(html)) return plainTextToNovelHtml(html);

  html = html.replace(/<!--[\s\S]*?-->/g, "");

  for (const tag of ["script", "style", "iframe", "object", "embed", "svg", "math", "form", "button", "textarea", "select", "option", "meta", "link"]) {
    html = html.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), "");
    html = html.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, "gi"), "");
  }

  html = html.replace(/\s+on[a-z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/\s+(?:class|id|data-[\w-]+|aria-[\w-]+|role)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  html = html.replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  html = html.replace(/\s+href\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (_match, rawValue) => {
    const safe = sanitizeUrl(rawValue, "href");
    return safe ? ` href="${escapeAttribute(safe)}"` : "";
  });

  html = html.replace(/\s+src\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (_match, rawValue) => {
    const safe = sanitizeUrl(rawValue, "src");
    return safe ? ` src="${escapeAttribute(safe)}"` : "";
  });

  html = html.replace(/<a\b([^>]*)>/gi, (full, attrs) => {
    if (!/\bhref\s*=/.test(attrs)) return "<span>";
    return `<a${attrs} target="_blank" rel="noopener noreferrer nofollow">`;
  });
  html = html.replace(/<\/a>/gi, "</a>");

  html = html.replace(/<img\b([^>]*)>/gi, (_match, attrs) => {
    const srcMatch = attrs.match(/\bsrc\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i);
    const safeSrc = sanitizeUrl(srcMatch?.[1] || "", "src");
    if (!safeSrc) return "";
    const altMatch = attrs.match(/\balt\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i);
    const alt = decodeBasicEntities(stripWrappingQuotes(altMatch?.[1] || "")).slice(0, 300);
    return `<img src="${escapeAttribute(safeSrc)}" alt="${escapeAttribute(alt)}">`;
  });

  const allowedTags = new Set([
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "blockquote",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "a",
    "img",
    "hr",
    "code",
    "pre",
    "figure",
    "figcaption",
    "span",
    "div",
    "table",
    "thead",
    "tbody",
    "tr",
    "td",
    "th",
  ]);

  html = html.replace(/<\/?([a-z0-9-]+)\b[^>]*>/gi, (full, rawTag) => {
    const tag = String(rawTag || "").toLowerCase();
    if (!allowedTags.has(tag)) return "";
    if (tag === "img") return full;
    if (tag === "a") return full;
    if (tag === "br" || tag === "hr") return full.startsWith("</") ? "" : `<${tag}>`;
    const isClosing = full.startsWith("</");
    return isClosing ? `</${tag}>` : `<${tag}>`;
  });

  html = html.replace(/<(p|div|blockquote|li|h1|h2|h3|h4|figcaption|td|th)>\s*<\/(p|div|blockquote|li|h1|h2|h3|h4|figcaption|td|th)>/gi, "");
  html = html.replace(/\n{3,}/g, "\n\n").trim();

  return html;
}

export function normalizeNovelContentForStorage(value: string | null | undefined) {
  return sanitizeNovelHtml(value);
}

export function novelContentHasMeaningfulContent(value: string | null | undefined) {
  const html = sanitizeNovelHtml(value);
  if (!html) return false;
  if (/<img\b/i.test(html)) return true;
  const text = decodeBasicEntities(
    html
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
  return text.length > 0;
}

export function getNovelReaderHtml(value: string | null | undefined) {
  return sanitizeNovelHtml(value);
}
