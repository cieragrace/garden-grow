"use client";

/**
 * GardenHub — the unified planning hub at /garden. Three accessible tabs:
 *   - "My Plants"  — the saved-plants collection (MyPlantsPanel)
 *   - "Companions" — the companion-planting experience (CompanionsPanel)
 *   - "Bed Layout" — the to-scale Bed Designer (BedDesigner)
 *
 * Tab state lives in the URL (?tab=…) so tabs are linkable and the old
 * /planner route can redirect to /garden?tab=companions. We keep a local mirror
 * so switching tabs is instant and doesn't depend on a navigation round-trip.
 *
 * Tabs follow the WAI-ARIA Tabs pattern: role=tablist/tab/tabpanel, roving
 * tabindex, aria-selected, and Left/Right/Home/End keyboard support.
 */

import {
  Suspense,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useGarden } from "@/lib/useGarden";
import { useLastZone } from "@/lib/useLastZone";
import MyPlantsPanel from "@/components/MyPlantsPanel";
import CompanionsPanel from "@/components/CompanionsPanel";
import BedDesigner from "@/components/BedDesigner";

/** Track first client mount so SSR + first paint match, avoiding hydration flicker. */
function useMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

type TabId = "plants" | "companions" | "bed";

const TABS: { id: TabId; label: string }[] = [
  { id: "plants", label: "My Plants" },
  { id: "companions", label: "Companions" },
  { id: "bed", label: "Bed Layout" },
];

function normalizeTab(value: string | null): TabId {
  return value === "companions" || value === "bed" ? value : "plants";
}

export default function GardenHub() {
  return (
    // useSearchParams must be wrapped in Suspense in the App Router.
    <Suspense fallback={<HubShell />}>
      <HubInner />
    </Suspense>
  );
}

function HubInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mounted = useMounted();
  const { count } = useGarden();
  const lastZone = useLastZone();

  const urlTab = normalizeTab(searchParams.get("tab"));
  const [active, setActive] = useState<TabId>(urlTab);

  // Re-sync local state ONLY when the URL tab changes externally (redirect,
  // back/forward) — not as an echo of our own selectTab. selectTab sets `active`
  // immediately and then router.replace updates the URL a render later; without
  // this guard that intermediate render would see urlTab (old) !== active (new)
  // and revert the tab, flickering on every click. Comparing against the
  // previous urlTab tells us whether the URL itself actually moved.
  //
  // The "previous value" lives in state (not a ref) so this stays within React's
  // adjusting-state-on-prop-change pattern — refs must not be read/written during
  // render. The setState calls short-circuit (guard becomes false) so there's no
  // loop, and React re-renders this component before its children.
  const [prevUrlTab, setPrevUrlTab] = useState(urlTab);
  if (urlTab !== prevUrlTab) {
    setPrevUrlTab(urlTab);
    if (urlTab !== active && mounted) {
      setActive(urlTab);
    }
  }

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectTab = useCallback(
    (id: TabId) => {
      setActive(id);
      // Shallow URL update so the tab is linkable without a full navigation.
      const params = new URLSearchParams(searchParams.toString());
      if (id === "plants") params.delete("tab");
      else params.set("tab", id);
      const qs = params.toString();
      router.replace(qs ? `/garden?${qs}` : "/garden", { scroll: false });
    },
    [router, searchParams],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = TABS.findIndex((t) => t.id === active);
      let next = idx;
      if (e.key === "ArrowRight") next = (idx + 1) % TABS.length;
      else if (e.key === "ArrowLeft")
        next = (idx - 1 + TABS.length) % TABS.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = TABS.length - 1;
      else return;
      e.preventDefault();
      const nextTab = TABS[next];
      selectTab(nextTab.id);
      tabRefs.current[next]?.focus();
    },
    [active, selectTab],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {mounted && lastZone !== null ? (
            <Link
              href={`/results/${lastZone.zip}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-soil-soft no-underline transition-colors hover:text-garden focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
            >
              ← Plants you can grow
            </Link>
          ) : null}
          <h1 className="mt-1 text-4xl font-display md:text-5xl">My Garden</h1>
          <p className="mt-2 text-soil-soft">
            Save crops, check companions, and design your bed — all in one place.
          </p>
        </div>
        {mounted ? (
          <span
            className="inline-flex items-center gap-2 rounded-full bg-sage-soft px-4 py-1.5 text-sm font-medium text-garden"
            aria-label={`${count} plant${count === 1 ? "" : "s"} saved`}
          >
            <span aria-hidden="true">🌱</span>
            {count} saved
          </span>
        ) : null}
      </header>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Garden planning views"
        onKeyDown={onKeyDown}
        className="mt-8 flex gap-1 border-b border-line"
      >
        {TABS.map((tab, i) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab.id)}
              className={`-mb-px rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft ${
                selected
                  ? "border-garden text-garden"
                  : "border-transparent text-soil-soft hover:text-garden"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div className="mt-8">
        {!mounted ? (
          <p className="text-soil-soft" aria-busy="true">
            Loading your garden…
          </p>
        ) : (
          TABS.map((tab) => (
            <div
              key={tab.id}
              role="tabpanel"
              id={`panel-${tab.id}`}
              aria-labelledby={`tab-${tab.id}`}
              hidden={tab.id !== active}
              tabIndex={0}
              className="focus:outline-none"
            >
              {tab.id === active ? <TabContent tab={tab.id} /> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TabContent({ tab }: { tab: TabId }) {
  if (tab === "companions") return <CompanionsPanel />;
  if (tab === "bed") return <BedDesigner />;
  return <MyPlantsPanel />;
}

/** Neutral shell shown during Suspense fallback (SSR-safe). */
function HubShell() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6" aria-busy="true">
      <h1 className="text-4xl font-display md:text-5xl">My Garden</h1>
      <p className="mt-2 text-soil-soft">Loading your garden…</p>
    </div>
  );
}
