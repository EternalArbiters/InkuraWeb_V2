export function formatUILanguageTemplate(
  template: string,
  replacements: Record<string, string | number | null | undefined>
) {
  return String(template || "").replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    const value = replacements[key];
    if (value === undefined || value === null) return match;
    return String(value);
  });
}
