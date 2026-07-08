"use client";

/**
 * ResultsGrid — the filterable plant grid on the results page. A client
 * component for the chip interactivity, but it still server-renders its
 * initial HTML (plants arrive as props), so the full grid stays visible to
 * crawlers.
 */

import { useMemo, useState } from "react";
import type { Plant, PlantCategory } from "@/data/plants";
import PlantCard from "@/components/PlantCard";

type Filter = "all" | PlantCategory | "water-wise";

/** Fixed display order for category chips. */
const CATEGORY_ORDER: PlantCategory[] = [
  "Vegetable",
  "Herb",
  "Leafy Green",
  "Root",
  "Legume",
];

export default function ResultsGrid({
  plants,
  zone,
}: {
  plants: Plant[];
  zone: number;
}) {
  const [filter, setFilter] = useState<Filter>("all");

  const categories = useMemo(() => {
    const present = new Set(plants.map((p) => p.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [plants]);
  const hasWaterWise = plants.some((p) => p.waterWise);

  const visible =
    filter === "all"
      ? plants
      : filter === "water-wise"
        ? plants.filter((p) => p.waterWise)
        : plants.filter((p) => p.category === filter);

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: `All (${plants.length})` },
    ...categories.map((c) => ({ id: c as Filter, label: c })),
    ...(hasWaterWise
      ? [{ id: "water-wise" as Filter, label: "💧 Water-wise" }]
      : []),
  ];

  return (
    <div>
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter plants"
      >
        {chips.map((chip) => {
          const active = chip.id === filter;
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(chip.id)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft ${
                active
                  ? "bg-garden text-cream"
                  : "border border-sage text-garden hover:bg-sage-soft"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {visible.length} plant{visible.length === 1 ? "" : "s"} shown.
      </p>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((plant) => (
          <li key={plant.id}>
            <PlantCard plant={plant} zone={zone} />
          </li>
        ))}
      </ul>
    </div>
  );
}
