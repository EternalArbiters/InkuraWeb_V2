export function parseHiddenInline(body: string): Array<{ type: "text" | "hidden"; value: string }> {
  // Delimiter: ||hidden|| (non-nested). Unmatched delimiters are treated as plain text.
  const out: Array<{ type: "text" | "hidden"; value: string }> = [];
  let i = 0;
  while (i < body.length) {
    const open = body.indexOf("||", i);
    if (open === -1) {
      out.push({ type: "text", value: body.slice(i) });
      break;
    }
    const close = body.indexOf("||", open + 2);
    if (close === -1) {
      out.push({ type: "text", value: body.slice(i) });
      break;
    }
    if (open > i) out.push({ type: "text", value: body.slice(i, open) });
    out.push({ type: "hidden", value: body.slice(open + 2, close) });
    i = close + 2;
  }
  return out;
}

export function isProbablyUrl(s: string) {
  const v = s.trim();
  if (!v) return false;
  return v.startsWith("http://") || v.startsWith("https://") || v.startsWith("www.");
}

export function normalizeUrl(s: string) {
  const v = s.trim();
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  if (v.startsWith("www.")) return `https://${v}`;
  return v;
}
