"use client";

/**
 * HeroEntry — the zone-aware entry control under the home hero header.
 *
 * - First-time visitors (or anyone with no saved zone) see the ZIP box.
 * - Returning visitors see their zone + actions: "See your plants", "Change ZIP",
 *   and "Clear". "Change ZIP" and "Clear" both bring the ZIP box back ("Clear"
 *   also forgets the saved zone).
 *
 * Rendered after mount to avoid a hydration mismatch (the server can't know the
 * remembered zone); before mount it shows the ZIP box, matching SSR.
 */

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { useLastZone } from "@/lib/useLastZone";
import { clearLastZone } from "@/lib/lastZone";
import ZipForm from "@/components/ZipForm";

/** True only after first client mount, so SSR + first paint match. */
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function HeroEntry() {
  const lastZone = useLastZone();
  const mounted = useMounted();
  const [editing, setEditing] = useState(false);

  const showActions = mounted && lastZone !== null && !editing;

  if (showActions) {
    return (
      <div className="mt-2 w-full max-w-md text-center">
        <p className="text-sm text-soil-soft">
          You&apos;re set for{" "}
          <span className="font-medium text-garden">
            USDA Zone {lastZone.zone}
          </span>
          .
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={`/results/${lastZone.zip}`}
            className="inline-flex items-center justify-center rounded-lg bg-carrot px-5 py-2.5 font-medium text-soil no-underline transition-colors hover:bg-carrot-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
          >
            See your plants →
          </Link>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center justify-center rounded-lg border border-line bg-cream px-5 py-2.5 font-medium text-soil transition-colors hover:bg-sage-soft hover:text-garden focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
          >
            Change ZIP
          </button>
          <button
            type="button"
            onClick={() => {
              clearLastZone();
              setEditing(false);
            }}
            className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 font-medium text-soil-soft transition-colors hover:text-carrot-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex w-full flex-col items-center gap-2">
      <ZipForm initialZip={editing && lastZone ? lastZone.zip : ""} />
      {editing && lastZone ? (
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs font-medium text-soil-soft underline-offset-2 hover:text-garden hover:underline focus:outline-none"
        >
          Cancel
        </button>
      ) : (
        <p className="text-xs text-soil-soft">
          Just looking around?{" "}
          <Link
            href="/results/80205"
            className="font-medium text-leaf underline-offset-2 hover:underline"
          >
            Try Denver — 80205
          </Link>
        </p>
      )}
    </div>
  );
}
