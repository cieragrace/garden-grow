import Link from "next/link";
import type { Plant } from "@/data/plants";
import VeggieIcon from "@/components/VeggieIcon";

interface PlantCardProps {
  plant: Plant;
  /** When set, links carry ?zone=N and is used for the detail calendar. */
  zone?: number;
  /** Optional slot for a save / remove control rendered in the card footer. */
  action?: React.ReactNode;
}

export default function PlantCard({ plant, zone, action }: PlantCardProps) {
  const href =
    zone != null
      ? `/plant/${plant.id}?zone=${zone}`
      : `/plant/${plant.id}`;

  return (
    <div className="group flex flex-col rounded-xl border border-line bg-cream-deep p-5 shadow-sm transition-colors hover:border-sage">
      <Link
        href={href}
        className="flex flex-1 flex-col no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft rounded-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <span aria-hidden="true">
            <VeggieIcon emoji={plant.emoji} name={plant.name} size={44} />
          </span>
          <span className="rounded-full bg-sage-soft px-3 py-1 text-xs font-medium text-garden">
            {plant.category}
          </span>
        </div>

        <h3 className="mt-3 text-xl text-garden transition-colors group-hover:text-leaf">
          {plant.name}
        </h3>

        <dl className="mt-3 flex flex-col gap-1 text-sm text-soil-soft">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Sun</dt>
            <span aria-hidden="true">☀️</span>
            <dd>{plant.sun}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="sr-only">Water</dt>
            <span aria-hidden="true">💧</span>
            <dd>{plant.water}</dd>
          </div>
        </dl>
      </Link>

      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
