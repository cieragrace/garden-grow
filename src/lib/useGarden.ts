"use client";

/**
 * useGarden — React bindings for the localStorage garden store.
 *
 * Uses useSyncExternalStore so every consumer (Nav badge, cards, detail page)
 * re-renders together when the saved set changes, and renders a stable empty
 * snapshot on the server to avoid hydration mismatches.
 */

import { useCallback, useSyncExternalStore } from "react";
import {
  getSaved,
  subscribe,
  toggleGarden as toggle,
  removeFromGarden as remove,
  addToGarden as add,
} from "./garden";

const SERVER_SNAPSHOT: string[] = [];

export function useSavedIds(): string[] {
  return useSyncExternalStore(
    subscribe,
    getSaved,
    () => SERVER_SNAPSHOT,
  );
}

export function useGarden() {
  const saved = useSavedIds();

  const isSaved = useCallback(
    (id: string) => saved.includes(id),
    [saved],
  );

  return {
    saved,
    count: saved.length,
    isSaved,
    toggle,
    add,
    remove,
  };
}
