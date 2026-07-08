import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidZip, zoneForZip } from "@/lib/zones";
import { plantsForZone } from "@/data/plants";
import ZipForm from "@/components/ZipForm";
import RememberZone from "./RememberZone";
import ResultsGrid from "./ResultsGrid";

interface PageProps {
  params: Promise<{ zip: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { zip } = await params;
  // Garbage ZIPs must 404 (see the page component) — don't emit indexable
  // "What to grow in xyz" metadata for them.
  if (!isValidZip(zip)) notFound();
  return {
    title: `What to grow in ${zip}`,
    description: `Your USDA hardiness zone for ZIP ${zip} and the vegetables and herbs that grow best there.`,
  };
}

/**
 * Server-rendered results: the zone and the full plant grid ship as real HTML
 * so crawlers, link previews, and AI answers see the page's actual content.
 * Zone resolution happens here on the server — API-refined when reachable
 * (with the short timeout in zones.ts), bundled zip3 fallback otherwise.
 */
export default async function ResultsPage({ params }: PageProps) {
  const { zip } = await params;

  // A malformed ZIP is a not-found, not a page: returning 200 here used to
  // create indexable soft-404s for any garbage URL. The segment's
  // not-found.tsx renders the friendly try-again UI with a real 404 status.
  if (!isValidZip(zip)) notFound();

  // Non-null: zoneForZip only returns null for invalid zips, checked above.
  const zone = (await zoneForZip(zip))!;
  const plants = plantsForZone(zone.zone);
  const isFallback = zone.source === "fallback";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <RememberZone zip={zip} zone={zone.zone} />

      <header className="flex flex-col gap-6 rounded-xl border border-line bg-cream-deep p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-medium text-soil-soft">ZIP {zip} is in</p>
          <h1 className="mt-1 text-4xl font-display md:text-5xl">
            USDA {zone.label}
          </h1>
          {isFallback ? (
            <p className="mt-2 max-w-md text-sm text-soil-soft">
              We couldn&apos;t reach the live zone service, so this is our best
              offline estimate. It&apos;s close enough to start planning —
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
          <ZipForm initialZip={zip} layout="inline" ctaLabel="Change" />
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
          <ResultsGrid plants={plants} zone={zone.zone} />
        )}
      </section>
    </div>
  );
}
