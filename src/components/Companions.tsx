import Link from "next/link";
import { getPlantById, type Plant } from "@/data/plants";
import VeggieIcon from "@/components/VeggieIcon";

interface CompanionsProps {
  plant: Plant;
  /** Current zone, preserved on companion links so users keep their context. */
  zone: number | null;
}

/** Resolve companion ids to plants, dropping any unknown ids. */
function resolve(ids: string[]): Plant[] {
  return ids
    .map((id) => getPlantById(id))
    .filter((p): p is Plant => p !== undefined);
}

interface CompanionListProps {
  heading: string;
  emoji: string;
  describedBy: string;
  emptyText: string;
  companions: Plant[];
  zone: number | null;
}

function CompanionList({
  heading,
  emoji,
  describedBy,
  emptyText,
  companions,
  zone,
}: CompanionListProps) {
  return (
    <div className="rounded-xl border border-line bg-cream-deep p-4">
      <h3
        id={describedBy}
        className="flex items-center gap-2 text-lg font-display"
      >
        <span aria-hidden="true">{emoji}</span>
        {heading}
      </h3>
      {companions.length === 0 ? (
        <p className="mt-3 text-sm text-soil-soft">{emptyText}</p>
      ) : (
        <ul
          aria-labelledby={describedBy}
          className="mt-3 flex flex-wrap gap-2"
        >
          {companions.map((c) => {
            const href =
              zone != null
                ? `/plant/${c.id}?zone=${zone}`
                : `/plant/${c.id}`;
            return (
              <li key={c.id}>
                <Link
                  href={href}
                  className="flex items-center gap-1.5 rounded-full border border-sage bg-cream px-3 py-1.5 text-sm text-garden no-underline transition-colors hover:bg-sage-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
                >
                  <span aria-hidden="true">
                    <VeggieIcon emoji={c.emoji} name={c.name} size={22} />
                  </span>
                  {c.name}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * "Companion planting" section — two lists of nearby-friendly and keep-apart
 * plants, each rendered as a chip linking to that companion's detail page
 * (preserving the current zone). Empty lists are handled gracefully.
 */
export default function Companions({ plant, zone }: CompanionsProps) {
  const friends = resolve(plant.companions.friends);
  const foes = resolve(plant.companions.foes);

  return (
    <section className="mt-8" aria-labelledby="companions-heading">
      <h2 id="companions-heading" className="text-2xl font-display">
        Companion planting
      </h2>
      <p className="mt-1 text-sm text-soil-soft">
        Good neighbours help {plant.name} thrive — others are best kept at a
        distance.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CompanionList
          heading="Plant near"
          emoji="🟢"
          describedBy="companions-friends-heading"
          emptyText={`No standout friends recorded for ${plant.name} — it plays well with most things.`}
          companions={friends}
          zone={zone}
        />
        <CompanionList
          heading="Keep apart"
          emoji="🔴"
          describedBy="companions-foes-heading"
          emptyText={`No known foes for ${plant.name} — plant it wherever you like.`}
          companions={foes}
          zone={zone}
        />
      </div>
    </section>
  );
}
