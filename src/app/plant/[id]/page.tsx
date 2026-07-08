import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPlantById, plants } from "@/data/plants";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import HowToPlant from "@/components/HowToPlant";
import SaveButton from "@/components/SaveButton";
import VeggieIcon from "@/components/VeggieIcon";
import ZoneAware from "./ZoneAware";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * The dataset is fully static, so every plant page prerenders at build time.
 * Zone personalization (?zone=N) lives in the ZoneAware client child, which
 * reads searchParams without forcing the page dynamic.
 */
export function generateStaticParams() {
  return plants.map((p) => ({ id: p.id }));
}

/** Unknown ids 404 immediately instead of attempting a dynamic render. */
export const dynamicParams = false;

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

export default async function PlantPage({ params }: PageProps) {
  const { id } = await params;

  const plant = getPlantById(id);
  if (!plant) notFound();

  // Structured data so search/AI results can cite the page as a growing guide.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `How to grow ${plant.name}`,
    description: plant.description,
    image: `${SITE_URL}/opengraph-image`,
    author: { "@type": "Person", name: "Ciera Muniz" },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: `${SITE_URL}/plant/${plant.id}`,
  };

  const facts: { emoji: string; label: string; value: string }[] = [
    { emoji: "☀️", label: "Sun", value: plant.sun },
    { emoji: "💧", label: "Water", value: plant.water },
    { emoji: "↔️", label: "Row spacing", value: plant.rowSpacing },
    { emoji: "🌱", label: "Seed spacing", value: plant.seedSpacing },
    { emoji: "⏳", label: "Harvest in", value: plant.growingDuration },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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

      {/* Calendar + companions personalize to ?zone=N client-side; the
          how-to-plant section stays server-rendered between them. */}
      <Suspense
        fallback={
          <div className="mt-8 h-48 animate-pulse rounded-xl border border-line bg-cream-deep" />
        }
      >
        <ZoneAware plant={plant}>
          <HowToPlant plant={plant} />
        </ZoneAware>
      </Suspense>
    </div>
  );
}
