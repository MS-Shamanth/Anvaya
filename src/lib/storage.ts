/**
 * Namespaced, versioned localStorage wrapper.
 *
 * Phase 1 has no backend, so the exchange state lives in the browser. Every
 * read is defensive: a corrupt or stale payload falls back to the seed rather
 * than taking the app down. Bump STORE_VERSION to invalidate old shapes.
 */

const STORE_VERSION = 'v1';
const key = (name: string) => `anvaya.${STORE_VERSION}.${name}`;

export function load<T>(name: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key(name));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    if (parsed === null || parsed === undefined) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function save<T>(name: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key(name), JSON.stringify(value));
  } catch {
    // Quota or private-mode failure: the session still works in memory.
  }
}

export function drop(name: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key(name));
  } catch {
    /* no-op */
  }
}

/** Clears every Anvaya key, used by the "reset demo data" control. */
export function resetAll(): void {
  if (typeof window === 'undefined') return;
  try {
    const prefix = `anvaya.${STORE_VERSION}.`;
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* no-op */
  }
}

let counter = 0;
/** Collision-resistant enough for a single-browser demo. */
export const uid = (prefix: string) => {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`;
};
