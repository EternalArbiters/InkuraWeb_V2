function clean(value: string | null | undefined) {
  const next = typeof value === "string" ? value.trim() : "";
  return next || null;
}

export function getChapterDisplayLabel(number: number, label?: string | null, options?: { short?: boolean }) {
  const customLabel = clean(label);
  if (customLabel) return customLabel;
  return options?.short ? `Ch. ${number}` : `Chapter ${number}`;
}

export function getChapterDisplayTitle(
  number: number,
  title?: string | null,
  label?: string | null,
  options?: { short?: boolean }
) {
  const base = getChapterDisplayLabel(number, label, options);
  const cleanTitle = clean(title);
  if (!cleanTitle) return base;
  if (cleanTitle.toLowerCase() === base.toLowerCase()) return base;
  return `${base}: ${cleanTitle}`;
}

export function getChapterSecondaryTitle(number: number, title?: string | null, label?: string | null) {
  const base = getChapterDisplayLabel(number, label);
  const cleanTitle = clean(title);
  if (!cleanTitle) return null;
  if (cleanTitle.toLowerCase() === base.toLowerCase()) return null;
  return cleanTitle;
}
