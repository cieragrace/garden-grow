/**
 * garden.ts — tiny client-side "My Garden" persistence over localStorage.
 *
 * Stores an array of plant ids under a single key. A lightweight pub/sub lets
 * multiple components (Nav badge, cards, detail toggle) stay in sync within the
 * same tab, and a `storage` event listener keeps tabs in sync too.
 */

export const SAVED_KEY = "garden-grow:saved";

type Listener = () => void;
const listeners = new Set<Listener>();

/** Stable empty reference for the server / empty states. */
const EMPTY: string[] = [];

/**
 * Cached snapshot. useSyncExternalStore requires getSnapshot to return a
 * referentially-stable value between changes — returning a fresh array on every
 * call causes an infinite render loop (React error #185). We cache the parsed
 * array and only invalidate it when the data actually changes (see notify()).
 */
let cache: string[] | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readSaved(): string[] {
  if (!isBrowser()) return EMPTY;
  try {
    const raw = window.localStorage.getItem(SAVED_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const ids = parsed.filter((id): id is string => typeof id === "string");
    return ids.length === 0 ? EMPTY : ids;
  } catch {
    return EMPTY;
  }
}

/**
 * Read the saved plant ids. Returns a STABLE reference between changes, so it is
 * safe to use directly as a useSyncExternalStore snapshot. Returns [] on the
 * server or if storage is empty/corrupt.
 */
export function getSaved(): string[] {
  if (!isBrowser()) return EMPTY;
  if (cache === null) cache = readSaved();
  return cache;
}

function writeSaved(ids: string[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(ids));
  } catch {
    // Storage full / unavailable — ignore; in-memory listeners still fire.
  }
  notify();
}

/** Is this plant id currently saved? */
export function isSaved(id: string): boolean {
  return getSaved().includes(id);
}

/** Add a plant id to the garden (no-op if already present). */
export function addToGarden(id: string): void {
  const current = getSaved();
  if (current.includes(id)) return;
  writeSaved([...current, id]);
}

/** Remove a plant id from the garden. */
export function removeFromGarden(id: string): void {
  const current = getSaved();
  if (!current.includes(id)) return;
  writeSaved(current.filter((x) => x !== id));
}

/** Toggle a plant id; returns the new saved state. */
export function toggleGarden(id: string): boolean {
  if (isSaved(id)) {
    removeFromGarden(id);
    return false;
  }
  addToGarden(id);
  return true;
}

/** Remove every plant from the garden. */
export function clearGarden(): void {
  if (getSaved().length === 0) return;
  writeSaved([]);
}

/** Subscribe to garden changes. Returns an unsubscribe function. */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify(): void {
  // Invalidate the cached snapshot so the next getSaved() returns a fresh,
  // newly-stable reference reflecting the change.
  cache = null;
  for (const listener of listeners) listener();
}

// Keep other tabs in sync. A null key means localStorage.clear() ran in
// another tab, which wipes this store too — resync on that as well.
if (isBrowser()) {
  window.addEventListener("storage", (e) => {
    if (e.key === SAVED_KEY || e.key === null) notify();
  });
}
