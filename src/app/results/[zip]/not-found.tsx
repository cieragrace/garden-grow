import ZipForm from "@/components/ZipForm";

/**
 * 404 for malformed /results/[zip] URLs — friendly retry UI, real 404 status
 * (so crawlers don't index garbage ZIPs as pages).
 */
export default function ResultsNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="text-5xl" aria-hidden="true">
        🤔
      </div>
      <h1 className="mt-4 text-3xl font-display">
        That ZIP doesn&apos;t look right
      </h1>
      <p className="mt-3 text-soil-soft">
        We need a valid 5-digit US ZIP code to find your zone. Try again below.
      </p>
      <div className="mt-8 flex justify-center">
        <ZipForm ctaLabel="Try again" />
      </div>
    </div>
  );
}
