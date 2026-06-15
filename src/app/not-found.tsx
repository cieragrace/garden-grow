import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="text-5xl" aria-hidden="true">
        🌱
      </div>
      <h1 className="mt-4 text-4xl font-display md:text-5xl">
        This patch is empty
      </h1>
      <p className="mt-3 text-soil-soft">
        We couldn&apos;t find the page you were looking for. It may have been
        moved, or the link might be a little weathered.
      </p>
      <div className="mt-8 flex justify-center">
        <Link
          href="/"
          className="rounded-lg bg-garden px-5 py-2.5 font-medium text-cream transition-colors hover:bg-leaf focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
        >
          Back to the garden
        </Link>
      </div>
    </div>
  );
}
