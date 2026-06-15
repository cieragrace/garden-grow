"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { isValidZip } from "@/lib/zones";

interface ZipFormProps {
  /** Prefill the input (e.g. on the results page). */
  initialZip?: string;
  /** "stacked" for the hero, "inline" for the compact results-page changer. */
  layout?: "stacked" | "inline";
  ctaLabel?: string;
}

export default function ZipForm({
  initialZip = "",
  layout = "stacked",
  ctaLabel = "See what I can grow",
}: ZipFormProps) {
  const router = useRouter();
  const inputId = useId();
  const [zip, setZip] = useState(initialZip);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidZip(zip);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setError("Please enter a valid 5-digit US ZIP code.");
      return;
    }
    setError(null);
    router.push(`/results/${zip}`);
  }

  const isInline = layout === "inline";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isInline
          ? "flex flex-col gap-2 sm:flex-row sm:items-end"
          : "flex w-full max-w-md flex-col gap-3"
      }
      noValidate
    >
      <div className={isInline ? "flex-1" : ""}>
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-soil"
        >
          Your ZIP code
        </label>
        <input
          id={inputId}
          name="zip"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          pattern="\d{5}"
          maxLength={5}
          placeholder="e.g. 80205"
          value={zip}
          onChange={(e) => {
            setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
            if (error) setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${inputId}-error` : `${inputId}-hint`
          }
          className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-soil placeholder:text-soil-soft focus:border-leaf focus:outline-none focus:ring-2 focus:ring-sage-soft"
        />
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-soil-soft">
          5 digits — we&apos;ll find your USDA hardiness zone.
        </p>
        {error ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="mt-1 min-h-[1rem] text-xs font-medium text-carrot-deep"
          >
            {error}
          </p>
        ) : (
          // Spacer keeps layout stable without an empty live region on mount.
          <p aria-hidden="true" className="mt-1 min-h-[1rem] text-xs" />
        )}
      </div>

      <button
        type="submit"
        aria-disabled={!valid}
        className="rounded-lg bg-carrot px-5 py-2.5 font-medium text-soil transition-colors hover:bg-carrot-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft aria-disabled:cursor-not-allowed aria-disabled:bg-sage aria-disabled:text-cream"
      >
        {ctaLabel}
      </button>
    </form>
  );
}
