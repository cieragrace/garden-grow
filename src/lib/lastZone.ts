/**
 * lastZone.ts — remembers the user's most recently resolved USDA zone.
 *
 * Mirrors garden.ts: a tiny client-side localStorage store with a lightweight
 * pub/sub so the Nav, home page, and garden hub can all reflect the user's
 * "home base" zone, plus a `storage` event listener to keep tabs in sync.
 *
 * Stored under a single key as { zip, zone } | null.
 */

export const LAST_ZONE_KEY = "garden-grow:zone";

export interface LastZone {
  zip: string;
  zone: number;
}

type Listener = () => void;
const listeners = new Set<Listener>();

/** Stable null reference for the server / empty states. */
const EMPTY: LastZone | null = null;

/**
 * Cached snapshot. useSyncExternalStore requires getSnapshot to return a
 * referentially-stable value between changes — returning a fresh object on
 * every call causes an infinite render loop (React error #185). We cache the
 * parsed value and only invalidate it when the data actually changes (see
 * notify()).
 */
let cache: LastZone | null = null;
/** Distinguish "cache not yet populated" from "cache is legitimately null". */
let cacheValid = false;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readLastZone(): LastZone | null {
  if (!isBrowser()) return EMPTY;
  try {
    const raw = window.localStorage.getItem(LAST_ZONE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      typeof (parsed as LastZone).zip !== "string" ||
      typeof (parsed as LastZone).zone !== "number"
    ) {
      return EMPTY;
    }
    const { zip, zone } = parsed as LastZone;
    return { zip, zone };
  } catch {
    return EMPTY;
  }
}

/**
 * Read the last resolved zone. Returns a STABLE reference between changes, so
 * it is safe to use directly as a useSyncExternalStore snapshot. Returns null
 * on the server or if storage is empty/corrupt.
 */
export function getLastZone(): LastZone | null {
  if (!isBrowser()) return EMPTY;
  if (!cacheValid) {
    cache = readLastZone();
    cacheValid = true;
  }
  return cache;
}

/** Persist the latest resolved zone (no-op if unchanged). */
export function setLastZone(value: LastZone): void {
  if (!isBrowser()) return;
  const current = getLastZone();
  if (current && current.zip === value.zip && current.zone === value.zone) {
    return; // No change — avoid a needless notify/re-render.
  }
  try {
    window.localStorage.setItem(LAST_ZONE_KEY, JSON.stringify(value));
  } catch {
    // Storage full / unavailable — ignore; in-memory listeners still fire.
  }
  notify();
}

/** Clear the remembered zone. */
export function clearLastZone(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(LAST_ZONE_KEY);
  } catch {
    // ignore
  }
  notify();
}

/** Subscribe to zone changes. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  // Invalidate the cached snapshot so the next getLastZone() returns a fresh,
  // newly-stable reference reflecting the change.
  cacheValid = false;
  cache = null;
  for (const listener of listeners) listener();
}

// Keep other tabs in sync. A null key means localStorage.clear() ran in
// another tab, which wipes this store too — resync on that as well.
if (isBrowser()) {
  window.addEventListener("storage", (e) => {
    if (e.key === LAST_ZONE_KEY || e.key === null) notify();
  });
}
