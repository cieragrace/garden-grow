import { plantingWindows, type Plant } from "@/data/plants";

interface PlantCalendarProps {
  plant: Plant;
  zone: number;
  /**
   * Whether `zone` was an explicit, in-range request. When false, the calendar
   * is shown "for reference" with an inline note (the requested zone falls
   * outside this plant's recommended zones).
   */
  zoneInRange?: boolean;
}

/** Format a plant's zone array as a compact range, e.g. "5–10". */
function formatZones(zones: number[]): string {
  if (zones.length === 0) return "—";
  const min = Math.min(...zones);
  const max = Math.max(...zones);
  return min === max ? `${min}` : `${min}–${max}`;
}

interface Phase {
  emoji: string;
  label: string;
  hint: string;
  start: string | null;
  end: string | null;
}

function formatRange(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  return start === end ? start : `${start} – ${end}`;
}

export default function PlantCalendar({
  plant,
  zone,
  zoneInRange = true,
}: PlantCalendarProps) {
  const w = plantingWindows(plant, zone);
  const outOfRange = !zoneInRange;

  const phases: Phase[] = [
    {
      emoji: "🪴",
      label: "Start seeds indoors",
      hint: "Sow in trays on a sunny sill or under lights.",
      start: w.indoorStart,
      end: w.indoorEnd,
    },
    {
      emoji: "🌱",
      label: "Transplant seedlings out",
      hint: "Harden off, then move young plants to the garden.",
      start: w.seedlingStart,
      end: w.seedlingEnd,
    },
    {
      emoji: "🌾",
      label: "Sow seeds outdoors",
      hint: "Plant directly into prepared garden soil.",
      start: w.outdoorStart,
      end: w.outdoorEnd,
    },
  ];

  const visible = phases.filter(
    (p) => formatRange(p.start, p.end) !== null,
  );

  return (
    <section
      aria-labelledby="calendar-heading"
      className="rounded-xl border border-line bg-cream-deep p-6"
    >
      <h2 id="calendar-heading" className="text-2xl font-display">
        Planting calendar for Zone {zone}
      </h2>
      <p className="mt-1 text-sm text-soil-soft">
        Approximate windows, shifted for your zone&apos;s season length.
      </p>

      {outOfRange ? (
        <p
          role="note"
          className="mt-3 flex items-start gap-2 rounded-lg border border-sage bg-sage-soft px-3 py-2 text-sm text-garden"
        >
          <span aria-hidden="true">ℹ️</span>
          <span>
            {plant.name} is best in zones {formatZones(plant.zones)} — calendar
            shown for reference.
          </span>
        </p>
      ) : null}

      {visible.length === 0 ? (
        <p className="mt-4 text-sm text-soil-soft">
          No standard planting window data for this crop. Follow your seed
          packet and local last-frost date.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {visible.map((phase) => (
            <li
              key={phase.label}
              className="flex items-start gap-3 rounded-lg border border-line bg-cream p-3"
            >
              <span className="text-2xl" aria-hidden="true">
                {phase.emoji}
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="font-medium text-soil">{phase.label}</p>
                  <p className="font-display text-lg text-garden">
                    {formatRange(phase.start, phase.end)}
                  </p>
                </div>
                <p className="mt-0.5 text-sm text-soil-soft">{phase.hint}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
