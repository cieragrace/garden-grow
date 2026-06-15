import type { Plant } from "@/data/plants";

interface HowToPlantProps {
  plant: Plant;
}

/**
 * "How to plant" panel — planting depth, seed spacing, row spacing, and mature
 * size, laid out in the same card language as "Care at a glance".
 */
export default function HowToPlant({ plant }: HowToPlantProps) {
  const steps: { emoji: string; label: string; value: string }[] = [
    { emoji: "📏", label: "Planting depth", value: plant.plantingDepth },
    { emoji: "🌱", label: "Seed spacing", value: plant.seedSpacing },
    { emoji: "↔️", label: "Row spacing", value: plant.rowSpacing },
    { emoji: "📐", label: "Mature size", value: plant.matureSize },
  ];

  return (
    <section className="mt-8" aria-labelledby="how-to-plant-heading">
      <h2 id="how-to-plant-heading" className="text-2xl font-display">
        How to plant
      </h2>
      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <div
            key={step.label}
            className="flex items-start gap-3 rounded-xl border border-line bg-cream-deep p-4"
          >
            <span className="text-2xl" aria-hidden="true">
              {step.emoji}
            </span>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-soil-soft">
                {step.label}
              </dt>
              <dd className="text-soil">{step.value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  );
}
