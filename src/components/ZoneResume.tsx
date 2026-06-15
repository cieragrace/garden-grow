"use client";

/**
 * ZoneResume — returning-visitor banner for the home hero.
 *
 * When a last zone is remembered (client, after mount to avoid a hydration
 * mismatch), it shows a friendly "welcome back" banner with a primary link to
 * the user's plants and a secondary "Change ZIP" button that reveals + focuses
 * the existing ZIP form. When nothing is remembered, it renders nothing so the
 * normal first-time hero + form shows untouched.
 *
 * The ZIP form itself lives in the page hero under an element with
 * id={ZIP_FORM_ANCHOR_ID}. We don't replace or re-implement it — "Change ZIP"
 * just scrolls to and focuses its input.
 */

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useLastZone } from "@/lib/useLastZone";

/** Shared anchor id for the hero's ZIP form, focused by "Change ZIP". */
export const ZIP_FORM_ANCHOR_ID = "zip-form-anchor";

/** True only after the first client mount, so SSR + first paint match. */
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export default function ZoneResume() {
  const lastZone = useLastZone();
  const mounted = useMounted();

  if (!mounted || lastZone === null) return null;

  function focusZipForm() {
    const anchor = document.getElementById(ZIP_FORM_ANCHOR_ID);
    if (!anchor) return;
    anchor.scrollIntoView({ behavior: "smooth", block: "center" });
    const input = anchor.querySelector<HTMLInputElement>("input");
    // Focus after the scroll settles; focusing immediately can fight the scroll.
    window.setTimeout(() => input?.focus({ preventScroll: true }), 250);
  }

  return (
    <div
      className="w-full max-w-xl rounded-xl border border-line bg-cream-deep p-5 text-left sm:p-6"
      role="status"
    >
      <p className="text-sm font-medium text-soil-soft">Welcome back</p>
      <h2 className="mt-1 text-2xl font-display text-garden">
        You&apos;re in USDA Zone {lastZone.zone}.
      </h2>
      <p className="mt-1 text-sm text-soil-soft">
        Pick up where you left off, or look up a different ZIP.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Link
          href={`/results/${lastZone.zip}`}
          className="inline-flex items-center justify-center rounded-lg bg-carrot px-5 py-2.5 font-medium text-soil no-underline transition-colors hover:bg-carrot-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
        >
          See your plants →
        </Link>
        <button
          type="button"
          onClick={focusZipForm}
          className="inline-flex items-center justify-center rounded-lg border border-line bg-cream px-5 py-2.5 font-medium text-soil transition-colors hover:bg-sage-soft hover:text-garden focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
        >
          Change ZIP
        </button>
      </div>
    </div>
  );
}
