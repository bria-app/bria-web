/**
 * Short-lived in-memory cache for reads that many components need on the same screen (the
 * signed-in user, the company). Failed loads are not kept, and a write clears its entries.
 */
const entries = new Map<string, { at: number; value: Promise<unknown> }>();

export function remember<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = entries.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as Promise<T>;
  const value = load();
  entries.set(key, { at: Date.now(), value });
  value.catch(() => {
    if (entries.get(key)?.value === value) entries.delete(key);
  });
  return value;
}

/** Drops every entry whose key starts with `prefix`. */
export function forget(prefix: string): void {
  for (const key of entries.keys()) if (key.startsWith(prefix)) entries.delete(key);
}
