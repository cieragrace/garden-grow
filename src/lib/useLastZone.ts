"use client";

/**
 * useLastZone — React binding for the localStorage last-zone store.
 *
 * Uses useSyncExternalStore so every consumer (Nav link, home banner, garden
 * back-link) re-renders together when the remembered zone changes, and renders
 * a stable null snapshot on the server to avoid hydration mismatches.
 */

import { useSyncExternalStore } from "react";
import { getLastZone, subscribe, type LastZone } from "./lastZone";

/** Stable server snapshot — never a fresh object. */
function getServerSnapshot(): LastZone | null {
  return null;
}

export function useLastZone(): LastZone | null {
  return useSyncExternalStore(subscribe, getLastZone, getServerSnapshot);
}
