import "client-only";

type CacheEntry<T> = {
  value?: T;
  expiresAt: number;
  inflight?: Promise<T>;
};

const resourceCache = new Map<string, CacheEntry<unknown>>();

function getFreshEntry<T>(key: string) {
  const entry = resourceCache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (entry.value !== undefined && entry.expiresAt > Date.now()) return entry;
  if (!entry.inflight) {
    resourceCache.delete(key);
    return null;
  }
  return entry;
}

export function readClientResource<T>(key: string): T | undefined {
  const entry = getFreshEntry<T>(key);
  return entry?.value;
}

export function seedClientResource<T>(key: string, value: T, ttlMs = 15_000) {
  resourceCache.set(key, {
    value,
    expiresAt: Date.now() + Math.max(0, ttlMs),
  });
}

export function mutateClientResource<T>(
  key: string,
  updater: (current: T | undefined) => T | undefined,
  ttlMs = 15_000
) {
  const current = readClientResource<T>(key);
  const next = updater(current);
  if (next === undefined) {
    resourceCache.delete(key);
    return;
  }
  seedClientResource(key, next, ttlMs);
}

export function invalidateClientResource(key: string) {
  resourceCache.delete(key);
}

export async function getOrFetchClientResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttlMs?: number; force?: boolean }
): Promise<T> {
  const ttlMs = Math.max(0, options?.ttlMs ?? 15_000);
  const force = !!options?.force;

  if (!force) {
    const entry = getFreshEntry<T>(key);
    if (entry?.value !== undefined) return entry.value;
    if (entry?.inflight) return entry.inflight;
  }

  const inflight = fetcher()
    .then((value) => {
      seedClientResource(key, value, ttlMs);
      return value;
    })
    .catch((error) => {
      const previous = readClientResource<T>(key);
      if (previous === undefined) {
        resourceCache.delete(key);
      } else {
        seedClientResource(key, previous, ttlMs);
      }
      throw error;
    });

  resourceCache.set(key, {
    value: force ? undefined : readClientResource<T>(key),
    expiresAt: Date.now() + ttlMs,
    inflight,
  });

  try {
    return await inflight;
  } finally {
    const latest = resourceCache.get(key) as CacheEntry<T> | undefined;
    if (latest?.inflight === inflight) {
      delete latest.inflight;
      resourceCache.set(key, latest as CacheEntry<unknown>);
    }
  }
}
