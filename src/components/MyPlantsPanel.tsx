"use client";

/**
 * MyPlantsPanel — the saved-plants collection, extracted so it can live inside
 * the unified Garden hub's "My Plants" tab. Renders WITHOUT a page-level
 * wrapper/heading; the hub supplies its own chrome.
 */

import Link from "next/link";
import { getPlantById } from "@/data/plants";
import { useGarden } from "@/lib/useGarden";
import { clearGarden } from "@/lib/garden";
import { useLastZone } from "@/lib/useLastZone";
import PlantCard from "@/components/PlantCard";
import SaveButton from "@/components/SaveButton";

export default function MyPlantsPanel() {
  const { saved } = useGarden();
  // Carry the remembered zone into detail links so the calendar stays
  // tailored instead of nagging for a ZIP the app already knows.
  const lastZone = useLastZone();

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
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-soil-soft" aria-live="polite">
          {plants.length} plant{plants.length === 1 ? "" : "s"} saved.
        </p>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm("Remove all plants from your garden?")
            ) {
              clearGarden();
            }
          }}
          className="rounded-lg border border-line bg-cream px-3 py-1.5 text-sm font-medium text-soil-soft transition-colors hover:border-carrot hover:text-carrot-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
        >
          Clear garden
        </button>
      </div>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plants.map((plant) => (
          <li key={plant.id}>
            <PlantCard
              plant={plant}
              zone={lastZone?.zone}
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
