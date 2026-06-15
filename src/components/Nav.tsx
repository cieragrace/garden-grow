"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useGarden } from "@/lib/useGarden";
import { useLastZone } from "@/lib/useLastZone";

/** True only after the first client mount, so SSR + first paint match. */
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function Nav() {
  const { count } = useGarden();
  const lastZone = useLastZone();
  const mounted = useMounted();
  const showZone = mounted && lastZone !== null;

  return (
    <header className="border-b border-line bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75 sticky top-0 z-20">
      <nav
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6"
        aria-label="Primary"
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl font-semibold text-garden no-underline transition-colors hover:text-leaf"
        >
          <span aria-hidden="true" className="text-2xl">
            🌱
          </span>
          <span>Garden Grow</span>
        </Link>

        <ul className="flex items-center gap-1 text-sm sm:gap-2">
          <li>
            <Link
              href="/"
              className="rounded-lg px-3 py-2 font-medium text-soil no-underline transition-colors hover:bg-sage-soft hover:text-garden focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
            >
              Home
            </Link>
          </li>
          {showZone ? (
            <li>
              <Link
                href={`/results/${lastZone.zip}`}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-medium text-soil no-underline transition-colors hover:bg-sage-soft hover:text-garden focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
                aria-label={`Plants you can grow in USDA Zone ${lastZone.zone}`}
              >
                <span aria-hidden="true">🌱</span>
                Zone {lastZone.zone}
              </Link>
            </li>
          ) : null}
          <li>
            <Link
              href="/garden"
              className="flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-soil no-underline transition-colors hover:bg-sage-soft hover:text-garden focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
            >
              My Garden
              <span
                className="inline-flex min-w-5 items-center justify-center rounded-full bg-garden px-1.5 py-0.5 text-xs font-semibold text-cream"
                aria-label={`${count} plant${count === 1 ? "" : "s"} saved`}
              >
                {count}
              </span>
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
