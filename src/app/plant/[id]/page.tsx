import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlantById } from "@/data/plants";
import PlantCalendar from "@/components/PlantCalendar";
import HowToPlant from "@/components/HowToPlant";
import Companions from "@/components/Companions";
import SaveButton from "@/components/SaveButton";
import VeggieIcon from "@/components/VeggieIcon";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ zone?: string }>;
}

/** Parse a sane zone (3–13) from the query string, or null. */
function parseZone(raw: string | undefined): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 13) return null;
  return n;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const plant = getPlantById(id);
  if (!plant) {
    return { title: "Plant not found" };
  }
  return {
    title: `${plant.name} — care & planting calendar`,
    description: plant.description,
  };
}

export default async function PlantPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { zone: zoneParam } = await searchParams;

  const plant = getPlantById(id);
  if (!plant) notFound();

  const zone = parseZone(zoneParam);
  // Fall back to the dataset's baseline (zone 6) so the calendar still renders.
  const calendarZone = zone ?? 6;
  // Only treat the calendar as authoritative when an explicit zone is both
  // provided AND within this plant's recommended zones. Otherwise it's shown
  // "for reference" with an inline note (see PlantCalendar).
  const zoneInRange = zone == null || plant.zones.includes(zone);

  const facts: { emoji: string; label: string; value: string }[] = [
    { emoji: "☀️", label: "Sun", value: plant.sun },
    { emoji: "💧", label: "Water", value: plant.water },
    { emoji: "↔️", label: "Row spacing", value: plant.rowSpacing },
    { emoji: "🌱", label: "Seed spacing", value: plant.seedSpacing },
    { emoji: "⏳", label: "Harvest in", value: plant.growingDuration },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm">
        <Link
          href="/"
          className="text-leaf no-underline hover:underline"
        >
          Home
        </Link>
        <span className="mx-2 text-soil-soft" aria-hidden="true">
          /
        </span>
        <span className="text-soil-soft">{plant.name}</span>
      </nav>

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span aria-hidden="true">
            <VeggieIcon emoji={plant.emoji} name={plant.name} size={80} />
          </span>
          <div>
            <span className="rounded-full bg-sage-soft px-3 py-1 text-xs font-medium text-garden">
              {plant.category}
            </span>
            <h1 className="mt-2 text-4xl font-display">{plant.name}</h1>
          </div>
        </div>
        <SaveButton plantId={plant.id} plantName={plant.name} />
      </header>

      <p className="mt-5 text-base leading-relaxed text-soil">
        {plant.description}
      </p>

      {/* Care facts */}
      <section className="mt-8" aria-labelledby="care-heading">
        <h2 id="care-heading" className="text-2xl font-display">
          Care at a glance
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="flex items-center gap-3 rounded-xl border border-line bg-cream-deep p-4"
            >
              <span className="text-2xl" aria-hidden="true">
                {fact.emoji}
              </span>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-soil-soft">
                  {fact.label}
                </dt>
                <dd className="text-soil">{fact.value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* Planting calendar */}
      <div className="mt-8">
        {zone == null ? (
          <p className="mb-3 text-sm text-soil-soft">
            Showing a typical Zone 6 calendar.{" "}
            <Link href="/" className="font-medium text-leaf hover:underline">
              Enter your ZIP
            </Link>{" "}
            for windows tailored to your area.
          </p>
        ) : null}
        <PlantCalendar
          plant={plant}
          zone={calendarZone}
          zoneInRange={zoneInRange}
        />
      </div>

      {/* How to plant */}
      <HowToPlant plant={plant} />

      {/* Companion planting */}
      <Companions plant={plant} zone={zone} />
    </div>
  );
}
