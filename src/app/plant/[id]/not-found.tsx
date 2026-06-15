import Link from "next/link";

export default function PlantNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <div className="text-5xl" aria-hidden="true">
        🌵
      </div>
      <h1 className="mt-4 text-3xl font-display">We couldn&apos;t find that plant</h1>
      <p className="mt-3 text-soil-soft">
        It may have been moved or never existed in our garden.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-lg bg-garden px-5 py-2.5 font-medium text-cream no-underline transition-colors hover:bg-leaf"
      >
        Back home
      </Link>
    </div>
  );
}
