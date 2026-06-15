"use client";

/**
 * MyPlantsPanel — the saved-plants collection, extracted so it can live inside
 * the unified Garden hub's "My Plants" tab. Renders WITHOUT a page-level
 * wrapper/heading; the hub supplies its own chrome.
 */

import Link from "next/link";
import { getPlantById } from "@/data/plants";
import { useGarden } from "@/lib/useGarden";
import PlantCard from "@/components/PlantCard";
import SaveButton from "@/components/SaveButton";

export default function MyPlantsPanel() {
  const { saved } = useGarden();

  const plants = saved
    .map((id) => getPlantById(id))
    .filter((p): p is NonNullable<typeof p> => p != null);

  if (plants.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-cream-deep p-10 text-center">
        <div className="text-5xl" aria-hidden="true">
          🪴
        </div>
        <h2 className="mt-4 text-2xl font-display">Nothing planted yet</h2>
        <p className="mt-2 text-soil-soft">
          Find your zone and save a few crops to start your plan.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-carrot px-5 py-2.5 font-medium text-soil no-underline transition-colors hover:bg-carrot-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
        >
          Find what I can grow
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-soil-soft" aria-live="polite">
        {plants.length} plant{plants.length === 1 ? "" : "s"} saved.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map((plant) => (
          <li key={plant.id}>
            <PlantCard
              plant={plant}
              action={
                <SaveButton
                  plantId={plant.id}
                  plantName={plant.name}
                  variant="compact"
                />
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
