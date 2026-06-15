"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isValidZip, zoneForZip, type ZoneResult } from "@/lib/zones";
import { setLastZone } from "@/lib/lastZone";
import { plantsForZone, type Plant } from "@/data/plants";
import PlantCard from "@/components/PlantCard";
import ZipForm from "@/components/ZipForm";

type Status = "loading" | "invalid" | "ready";

interface State {
  status: Status;
  zone: ZoneResult | null;
  plants: Plant[];
}

function initialState(zip: string): State {
  return isValidZip(zip)
    ? { status: "loading", zone: null, plants: [] }
    : { status: "invalid", zone: null, plants: [] };
}

export default function ResultsView({ zip }: { zip: string }) {
  // Derive the starting status from the zip so the effect never has to
  // synchronously setState (which React 19 / the linter flags).
  const [state, setState] = useState<State>(() => initialState(zip));
  // Reset during render if the zip prop changes (adjusting-state-on-prop-change
  // pattern) so we don't briefly show stale results for a new ZIP.
  const [lastZip, setLastZip] = useState(zip);
  if (zip !== lastZip) {
    setLastZip(zip);
    setState(initialState(zip));
  }

  useEffect(() => {
    if (!isValidZip(zip)) return;

    let active = true;

    zoneForZip(zip)
      .then((result) => {
        if (!active) return;
        if (!result) {
          setState({ status: "invalid", zone: null, plants: [] });
          return;
        }
        // Remember this as the user's home base — only on a successful resolve.
        setLastZone({ zip, zone: result.zone });
        setState({
          status: "ready",
          zone: result,
          plants: plantsForZone(result.zone),
        });
      })
      .catch(() => {
        if (active) setState({ status: "invalid", zone: null, plants: [] });
      });

    return () => {
      active = false;
    };
  }, [zip]);

  if (state.status === "invalid") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
        <div className="text-5xl" aria-hidden="true">
          🤔
        </div>
        <h1 className="mt-4 text-3xl font-display">
          That ZIP doesn&apos;t look right
        </h1>
        <p className="mt-3 text-soil-soft">
          &ldquo;{zip}&rdquo; isn&apos;t a valid 5-digit US ZIP code. Try again
          below.
        </p>
        <div className="mt-8 flex justify-center">
          <ZipForm ctaLabel="Try again" />
        </div>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div
        className="mx-auto max-w-5xl px-4 py-16 sm:px-6"
        aria-busy="true"
        aria-live="polite"
      >
        <p className="text-center text-soil-soft">
          Finding your hardiness zone for {zip}…
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["skeleton-0", "skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4", "skeleton-5"].map(
            (key) => (
              <div
                key={key}
                className="h-40 animate-pulse rounded-xl border border-line bg-cream-deep"
              />
            ),
          )}
        </div>
      </div>
    );
  }

  // ready
  const { zone, plants } = state;
  const isFallback = zone?.source === "fallback";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-6 rounded-xl border border-line bg-cream-deep p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-medium text-soil-soft">
            ZIP {zip} is in
          </p>
          <h1 className="mt-1 text-4xl font-display md:text-5xl">
            USDA {zone?.label}
          </h1>
          {isFallback ? (
            <p className="mt-2 max-w-md text-sm text-soil-soft">
              We couldn&apos;t reach the live zone service, so this is our
              best offline estimate. It&apos;s close enough to start planning —
              double-check against your local last-frost date.
            </p>
          ) : (
            <p className="mt-2 text-sm text-soil-soft">
              {plants.length} crop{plants.length === 1 ? "" : "s"} thrive in
              your zone.
            </p>
          )}
        </div>

        <div className="sm:max-w-xs sm:flex-shrink-0">
          <ZipForm
            initialZip={zip}
            layout="inline"
            ctaLabel="Change"
          />
        </div>
      </header>

      <section className="mt-8" aria-labelledby="plants-heading">
        <h2 id="plants-heading" className="text-2xl font-display">
          What you can grow
        </h2>

        {plants.length === 0 ? (
          <div className="mt-4 rounded-xl border border-line bg-cream-deep p-8 text-center">
            <p className="text-soil-soft">
              We don&apos;t have crop matches for this zone yet. Try a nearby
              ZIP, or{" "}
              <Link href="/" className="font-medium text-leaf hover:underline">
                start over
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plants.map((plant) => (
              <li key={plant.id}>
                <PlantCard plant={plant} zone={zone?.zone} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
