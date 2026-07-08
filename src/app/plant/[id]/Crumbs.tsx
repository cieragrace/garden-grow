"use client";

/**
 * Crumbs — plant-page breadcrumb. When a zone is remembered, adds a
 * "Zone {n} plants" crumb back to the results list so the browse → detail →
 * browse loop doesn't lean on the Back button. Renders the plain
 * Home / {plant} crumb on the server and first paint (the server can't know
 * the visitor's zone), then upgrades after mount.
 */

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useLastZone } from "@/lib/useLastZone";

/** True only after first client mount, so SSR + first paint match. */
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function Crumbs({ plantName }: { plantName: string }) {
  const lastZone = useLastZone();
  const mounted = useMounted();

  return (
    <nav aria-label="Breadcrumb" className="mb-6 text-sm">
      <Link href="/" className="text-leaf no-underline hover:underline">
        Home
      </Link>
      {mounted && lastZone !== null ? (
        <>
          <span className="mx-2 text-soil-soft" aria-hidden="true">
            /
          </span>
          <Link
            href={`/results/${lastZone.zip}`}
            className="text-leaf no-underline hover:underline"
          >
            Zone {lastZone.zone} plants
          </Link>
        </>
      ) : null}
      <span className="mx-2 text-soil-soft" aria-hidden="true">
        /
      </span>
      <span className="text-soil-soft">{plantName}</span>
    </nav>
  );
}
