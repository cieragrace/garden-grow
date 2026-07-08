"use client";

/**
 * ZoneAware — the zone-dependent slice of the plant detail page: the planting
 * calendar (shifted for the visitor's zone from the ?zone= query param) and
 * the companion chips (which carry the zone forward on their links).
 *
 * Isolated as a client component so the page itself can prerender statically:
 * reading searchParams in the server component would force every plant page
 * dynamic. Zone-independent sections (care facts, how-to-plant) stay server-
 * rendered and are threaded through as `children` to preserve section order.
 */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { matchableZone, type Plant } from "@/data/plants";
import PlantCalendar from "@/components/PlantCalendar";
import Companions from "@/components/Companions";

/** Parse a sane zone (1–13) from the query string, or null. */
function parseZone(raw: string | null): number | null {
  if (!raw) return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 13) return null;
  return n;
}

export default function ZoneAware({
  plant,
  children,
}: {
  plant: Plant;
  children?: React.ReactNode;
}) {
  const zone = parseZone(useSearchParams().get("zone"));
  // Fall back to the dataset's baseline (zone 6) so the calendar still renders.
  const calendarZone = zone ?? 6;
  // Only treat the calendar as authoritative when an explicit zone is both
  // provided AND within this plant's recommended zones. Tropical zones 12–13
  // count as in-range whenever zone 11 is (see matchableZone).
  const zoneInRange = zone == null || plant.zones.includes(matchableZone(zone));

  return (
    <>
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

      {/* Zone-independent sections, server-rendered by the page. */}
      {children}

      {/* Companion planting */}
      <Companions plant={plant} zone={zone} />
    </>
  );
}
