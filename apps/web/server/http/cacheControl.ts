export type PublicCacheOptions = {
  sMaxAge?: number;
  staleWhileRevalidate?: number;
};

export function publicCacheControl(options: PublicCacheOptions = {}) {
  const sMaxAge = Math.max(1, options.sMaxAge ?? 300);
  const staleWhileRevalidate = Math.max(0, options.staleWhileRevalidate ?? 86_400);

  return `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
}
