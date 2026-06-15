"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the error for diagnostics; replace with real logging if desired.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="text-5xl" aria-hidden="true">
        🥀
      </div>
      <h1 className="mt-4 text-4xl font-display md:text-5xl">
        Something wilted
      </h1>
      <p className="mt-3 text-soil-soft">
        We hit an unexpected snag while loading this page. Give it another go —
        a fresh try often does the trick.
      </p>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-carrot px-5 py-2.5 font-medium text-soil transition-colors hover:bg-carrot-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-sage px-5 py-2.5 font-medium text-garden transition-colors hover:bg-sage-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
        >
          Back to the garden
        </Link>
      </div>
    </div>
  );
}
