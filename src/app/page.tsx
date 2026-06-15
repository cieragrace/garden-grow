import type { Metadata } from "next";
import ZipForm from "@/components/ZipForm";
import ZoneResume, { ZIP_FORM_ANCHOR_ID } from "@/components/ZoneResume";

export const metadata: Metadata = {
  title: "Garden Grow — Find what to plant in your zone",
  description:
    "Enter your ZIP code to find your USDA hardiness zone and a personalized list of vegetables and herbs you can grow.",
};

const STEPS = [
  {
    emoji: "📍",
    title: "Enter your ZIP",
    body: "We look up your USDA hardiness zone — the simple number that tells you how long and warm your growing season is.",
  },
  {
    emoji: "🌿",
    title: "See what grows",
    body: "Browse a curated list of vegetables and herbs that thrive in your zone, with quick sun and water needs.",
  },
  {
    emoji: "🗓️",
    title: "Plan & save",
    body: "Open any plant for a zone-specific planting calendar, then save your favorites to My Garden.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-14 text-center sm:py-20">
        {/* Returning visitors see a "welcome back" banner here; first-timers
            see nothing extra (ZoneResume renders null). */}
        <ZoneResume />
        <span
          className="rounded-full bg-sage-soft px-4 py-1.5 text-sm font-medium text-garden"
          aria-hidden="true"
        >
          🌱 Grow something this season
        </span>
        <h1 className="text-4xl font-display md:text-5xl">
          What can you grow
          <br className="hidden sm:block" /> where you live?
        </h1>
        <p className="max-w-xl text-base leading-relaxed text-soil-soft">
          Garden Grow turns your ZIP code into a personalized planting list.
          Find your hardiness zone, discover crops that thrive nearby, and build
          a simple plan for the season — no green thumb required.
        </p>

        <div
          id={ZIP_FORM_ANCHOR_ID}
          className="mt-2 flex w-full justify-center scroll-mt-24"
        >
          <ZipForm />
        </div>
      </section>

      {/* How it works */}
      <section className="pb-16" aria-labelledby="how-heading">
        <h2 id="how-heading" className="sr-only">
          How Garden Grow works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-xl border border-line bg-cream-deep p-6"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">
                  {step.emoji}
                </span>
                <span className="text-sm font-semibold text-soil-soft">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="mt-3 text-xl text-garden">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-soil-soft">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
