"use client";

/**
 * CompanionsPanel — the companion-planting experience (conflicts + suggestions),
 * extracted so it can live inside the unified Garden hub's "Companions" tab.
 *
 * Reads the gardener's saved plants (My Garden via useGarden) and helps lay out
 * a single compatible bed:
 *   1. The current bed = saved plants as removable chips.
 *   2. Conflicts = foe pairs among the bed (companionReport().conflicts).
 *   3. Suggestions = good companions to add (companionReport().suggestions),
 *      each with a friendly "why" and an "Add to bed" button.
 *   4. A subtle summary line (N plants, M conflicts).
 *
 * All companion logic is pure (lib/companions.ts); this component is only the UI
 * binding + live wiring to the garden store. It renders WITHOUT a page-level
 * wrapper/heading so the hub can supply its own chrome.
 */

import Link from "next/link";
import { useMemo } from "react";
import { getPlantById } from "@/data/plants";
import {
  companionReport,
  areFriends,
  pairNote,
  type Plant,
} from "@/lib/companions";
import { useGarden } from "@/lib/useGarden";
import VeggieIcon from "@/components/VeggieIcon";

/** Join names into a natural-language list: "A", "A & B", "A, B & C". */
function listNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

export default function CompanionsPanel() {
  const { saved, add, remove } = useGarden();

  // Resolve saved ids → Plant objects (drop any unknown ids defensively).
  const bed = useMemo(
    () =>
      saved
        .map((id) => getPlantById(id))
        .filter((p): p is Plant => p != null),
    [saved],
  );

  const report = useMemo(() => companionReport(saved), [saved]);

  // For each suggestion, work out WHICH saved plants it pairs well with, so the
  // card can say "pairs well with Tomato & Pepper" instead of a bare name.
  const suggestions = useMemo(
    () =>
      report.suggestions
        .map((id) => getPlantById(id))
        .filter((p): p is Plant => p != null)
        .map((plant) => {
          const friendNames = bed
            .filter((s) => areFriends(plant.id, s.id))
            .map((s) => s.name);
          return { plant, friendNames };
        }),
    [report.suggestions, bed],
  );

  const conflictPairs = useMemo(
    () =>
      report.conflicts
        .map(({ a, b }) => {
          const pa = getPlantById(a);
          const pb = getPlantById(b);
          return pa && pb ? { a: pa, b: pb } : null;
        })
        .filter((p): p is { a: Plant; b: Plant } => p != null),
    [report.conflicts],
  );

  const plantCount = bed.length;
  const conflictCount = conflictPairs.length;

  if (plantCount === 0) {
    return <EmptyBed />;
  }

  return (
    <div>
      <p className="text-sm text-soil-soft">
        Spot neighbors that won&apos;t get along, and add companions worth
        planting.
      </p>

      {/* Subtle summary */}
      <p className="mt-4 text-sm text-soil-soft" aria-live="polite">
        {plantCount} plant{plantCount === 1 ? "" : "s"} in this bed
        {" · "}
        {conflictCount === 0
          ? "no conflicts"
          : `${conflictCount} conflict${conflictCount === 1 ? "" : "s"}`}
      </p>

      {/* The bed */}
      <section className="mt-4" aria-labelledby="bed-heading">
        <h2 id="bed-heading" className="text-2xl font-display">
          Your bed
        </h2>
        <ul
          className="mt-4 flex flex-wrap gap-3"
          aria-label="Plants in your bed"
        >
          {bed.map((plant) => (
            <li key={plant.id}>
              <BedChip plant={plant} onRemove={() => remove(plant.id)} />
            </li>
          ))}
        </ul>
      </section>

      {/* Conflicts */}
      <section className="mt-10" aria-labelledby="conflicts-heading">
        <h2 id="conflicts-heading" className="text-2xl font-display">
          Bed harmony
        </h2>
        {conflictCount === 0 ? (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-sage bg-sage-soft px-5 py-4">
            <span className="text-2xl" aria-hidden="true">
              ✓
            </span>
            <p className="font-medium text-garden">
              Everything here gets along.
            </p>
          </div>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {conflictPairs.map(({ a, b }) => {
              const why = pairNote(a.id, b.id);
              return (
                <li
                  key={`${a.id}-${b.id}`}
                  className="flex items-start gap-3 rounded-xl border border-carrot/40 bg-carrot/10 px-5 py-4"
                >
                  <span className="text-2xl" aria-hidden="true">
                    ⚠️
                  </span>
                  <div className="text-soil">
                    <p>
                      <span aria-hidden="true">
                        <VeggieIcon emoji={a.emoji} name={a.name} size={22} />{" "}
                      </span>
                      <span className="font-medium">{a.name}</span> and{" "}
                      <span aria-hidden="true">
                        <VeggieIcon emoji={b.emoji} name={b.name} size={22} />{" "}
                      </span>
                      <span className="font-medium">{b.name}</span>{" "}
                      shouldn&apos;t share a bed.
                    </p>
                    {why ? (
                      <p className="mt-1 text-sm text-soil-soft">{why}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Suggestions */}
      <section className="mt-10" aria-labelledby="suggestions-heading">
        <h2 id="suggestions-heading" className="text-2xl font-display">
          Good companions to add
        </h2>
        {suggestions.length === 0 ? (
          <p className="mt-3 text-soil-soft">
            No standout companions to suggest right now — your bed is already
            well matched.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map(({ plant, friendNames }) => (
              <li key={plant.id}>
                <SuggestionCard
                  plant={plant}
                  friendNames={friendNames}
                  onAdd={() => add(plant.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/** A removable plant chip in the current bed. */
function BedChip({
  plant,
  onRemove,
}: {
  plant: Plant;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-sage bg-cream-deep py-1.5 pl-3 pr-1.5 text-sm">
      <span aria-hidden="true">
        <VeggieIcon emoji={plant.emoji} name={plant.name} size={22} />
      </span>
      <span className="font-medium text-soil">{plant.name}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${plant.name} from the bed`}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-soil-soft transition-colors hover:bg-sage-soft hover:text-garden focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
      >
        <span aria-hidden="true" className="text-base leading-none">
          ×
        </span>
      </button>
    </span>
  );
}

/** A "good companion to add" card with an Add-to-bed action. */
function SuggestionCard({
  plant,
  friendNames,
  onAdd,
}: {
  plant: Plant;
  friendNames: string[];
  onAdd: () => void;
}) {
  const why =
    friendNames.length > 0
      ? `Pairs well with ${listNames(friendNames)}`
      : "A friendly all-round companion";

  return (
    <div className="flex h-full flex-col rounded-xl border border-line bg-cream-deep p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span aria-hidden="true">
          <VeggieIcon emoji={plant.emoji} name={plant.name} size={44} />
        </span>
        <span className="rounded-full bg-sage-soft px-3 py-1 text-xs font-medium text-garden">
          {plant.category}
        </span>
      </div>

      <h3 className="mt-3 text-xl text-garden">{plant.name}</h3>
      <p className="mt-1 flex-1 text-sm text-soil-soft">{why}.</p>

      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add ${plant.name} to the bed`}
        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-carrot px-3 py-1.5 text-sm font-medium text-soil transition-colors hover:bg-carrot-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
      >
        <span aria-hidden="true">＋</span>
        Add to bed
      </button>
    </div>
  );
}

/** Friendly empty state — the bed is built from My Garden, so point there. */
function EmptyBed() {
  return (
    <div className="rounded-xl border border-line bg-cream-deep p-10 text-center">
      <div className="text-5xl" aria-hidden="true">
        🪴
      </div>
      <h2 className="mt-4 text-2xl font-display">Your bed is empty</h2>
      <p className="mx-auto mt-2 max-w-md text-soil-soft">
        The companion planner builds from the plants in My Garden. Save a few
        crops and we&apos;ll help you arrange a bed that thrives together.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-carrot px-5 py-2.5 font-medium text-soil no-underline transition-colors hover:bg-carrot-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
      >
        Browse plants
      </Link>
    </div>
  );
}
