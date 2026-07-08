"use client";

/**
 * BedDesigner — a to-scale raised-bed layout tool (Garden hub "Bed Layout" tab).
 *
 * The user sets a bed size in FEET, then adds plants with quantity steppers.
 * Each plant's rowSpacing (parsed to inches via parseSpacingInches) is the
 * diameter of its circular "footprint" — the room a mature plant needs. We also
 * pass companion FOE pairs so the engine pushes foes to opposite sides. We hand
 * the bed dimensions (feet →
 * inches) and the plant quantities to the pure `layoutBed` engine, then render
 * the returned Placement[] as a to-scale SVG: a real rectangle with foot
 * gridlines, dimension labels, and one circle per plant instance sized to its
 * real spacing footprint. Overflow circles (fits === false) are drawn in a
 * warning amber so overcrowding is visible at a glance.
 *
 * All geometry lives in lib/bedLayout.ts; this component is purely the UI + the
 * input/quantity state.
 */

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  layoutBed,
  parseSpacingInches,
  type BedItem,
  type BedVerdict,
} from "@/lib/bedLayout";
import { plants as ALL_PLANTS, getPlantById, maturityDays } from "@/data/plants";
import { useGarden } from "@/lib/useGarden";
import { areFoes, areFriends } from "@/lib/companions";
import { readBedPlan, writeBedPlan } from "@/lib/bedPlan";
import VeggieIcon from "@/components/VeggieIcon";

/* ------------------------------------------------------------------------- *
 * Constants
 * ------------------------------------------------------------------------- */

const INCHES_PER_FOOT = 12;

/** Quick-pick bed presets, in FEET (width × length). */
const PRESETS: { label: string; widthFt: number; lengthFt: number }[] = [
  { label: "4 × 4", widthFt: 4, lengthFt: 4 },
  { label: "4 × 8", widthFt: 4, lengthFt: 8 },
  { label: "3 × 6", widthFt: 3, lengthFt: 6 },
];

/** Diagram sizing bounds (px). */
const DIAGRAM_MAX_W = 640;
const DIAGRAM_MAX_H = 520;
const DIAGRAM_PAD = 34; // room for dimension labels + frame around the bed
/** Visual thickness of the wooden frame, in px (outside the to-scale soil). */
const FRAME_PX = 10;

/** Verdict → palette + friendly copy. */
const VERDICT_COPY: Record<
  BedVerdict,
  { label: string; tone: string; line: (overflow: number) => string }
> = {
  roomy: {
    label: "Roomy",
    tone: "text-garden",
    line: () => "Roomy — plenty of space to spread out.",
  },
  snug: {
    label: "Snug",
    tone: "text-leaf",
    line: () => "Snug — a comfortable, well-used bed.",
  },
  cramped: {
    label: "Cramped",
    tone: "text-carrot-deep",
    line: () => "Cramped — give them a little more room.",
  },
  overcrowded: {
    label: "Overcrowded",
    tone: "text-carrot-deep",
    line: (overflow) =>
      overflow > 0
        ? `Overcrowded — ${overflow} plant${overflow === 1 ? "" : "s"} won't have room.`
        : "Overcrowded — there's not enough room for all of these.",
  },
};

/* ------------------------------------------------------------------------- *
 * Component
 * ------------------------------------------------------------------------- */

type QtyMap = Record<string, number>;

export default function BedDesigner() {
  const { saved } = useGarden();

  // A shared link (?w=4&l=8&p=tomato:2,basil:4) beats the persisted plan on
  // first render so "copy link to my plan" opens the exact same bed for the
  // recipient; afterwards the plan is user-owned local state as usual.
  const searchParams = useSearchParams();
  const urlPlan = useMemo(() => parseUrlPlan(searchParams), [searchParams]);

  // Bed dimensions, in FEET. Restored from URL plan, then persisted plan.
  const [widthFt, setWidthFt] = useState(() => {
    if (urlPlan) return urlPlan.widthFt;
    const stored = readBedPlan();
    return stored ? clampFt(stored.widthFt) : 4;
  });
  const [lengthFt, setLengthFt] = useState(() => {
    if (urlPlan) return urlPlan.lengthFt;
    const stored = readBedPlan();
    return stored ? clampFt(stored.lengthFt) : 8;
  });

  // Plant quantities, keyed by plant id. Restored from the persisted plan when
  // one exists (even an intentionally-emptied one); otherwise INTENTIONALLY
  // seeded from `saved` once on mount (lazy initializer) — after that, qty is
  // user-owned local state and deliberately does NOT track later changes to
  // `saved` (e.g. saving/removing plants from another tab while Bed stays
  // mounted). This avoids clobbering the counts the user has hand-tuned here;
  // the "Add my saved plants" button is the explicit, opt-in way to pull in
  // newly-saved plants.
  const [qty, setQty] = useState<QtyMap>(() => {
    if (urlPlan) return urlPlan.qty;
    const stored = readBedPlan();
    if (stored) return stored.qty;
    const seed: QtyMap = {};
    for (const id of saved) seed[id] = 1;
    return seed;
  });

  // Share feedback for the copy-link button.
  const [copied, setCopied] = useState(false);

  // Season view: null = plants drawn at mature footprint (the default and the
  // spacing-planning view). A number = "day N of the season" — circles shrink
  // toward seedling size and grow back as you scrub.
  const [seasonDay, setSeasonDay] = useState<number | null>(null);

  // Free-typing drafts for the size inputs: the committed feet update live
  // whenever the draft parses in-range, and clamping happens only on blur —
  // so clearing the field or typing a two-digit value doesn't get snapped
  // mid-keystroke by the controlled input.
  const [widthDraft, setWidthDraft] = useState<string | null>(null);
  const [lengthDraft, setLengthDraft] = useState<string | null>(null);

  // Write-through persistence: the tuned plan survives refresh/tab close,
  // matching how saved plants already behave.
  useEffect(() => {
    writeBedPlan({ widthFt, lengthFt, qty });
  }, [widthFt, lengthFt, qty]);

  // The picker's currently-selected (not-yet-added) plant id.
  const [pickId, setPickId] = useState("");

  /** Plants currently in the plan, in dataset order, with resolved spacing. */
  const planRows = useMemo(() => {
    return ALL_PLANTS.filter((p) => (qty[p.id] ?? 0) > 0).map((plant) => ({
      plant,
      count: qty[plant.id],
      // Footprint diameter = ROW spacing (the room a mature plant needs).
      spacingIn: parseSpacingInches(plant.rowSpacing),
    }));
  }, [qty]);

  /** Companion FOE pairs among the planned plants, so the engine pushes them
   *  to opposite sides of the bed. */
  const foePairs = useMemo(() => {
    const ids = planRows.map((r) => r.plant.id);
    const pairs: [string, string][] = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (areFoes(ids[i], ids[j])) pairs.push([ids[i], ids[j]]);
      }
    }
    return pairs;
  }, [planRows]);

  /** Build BedItem[] and run the pure layout engine. */
  const layout = useMemo(() => {
    const dims = {
      widthIn: widthFt * INCHES_PER_FOOT,
      lengthIn: lengthFt * INCHES_PER_FOOT,
    };
    const items: BedItem[] = planRows.map(({ plant, count, spacingIn }) => ({
      plantId: plant.id,
      spacingIn,
      qty: count,
    }));
    return layoutBed(dims, items, { foePairs });
  }, [widthFt, lengthFt, planRows, foePairs]);

  /** Plants the user can still add (not already in the plan), for the picker. */
  const addablePlants = useMemo(
    () => ALL_PLANTS.filter((p) => (qty[p.id] ?? 0) === 0),
    [qty],
  );

  const hasPlants = planRows.length > 0;

  /** Per-plant maturity (days) + season length for the scrubber. */
  const maturityById = useMemo(() => {
    const m = new Map<string, number>();
    for (const { plant } of planRows) m.set(plant.id, maturityDays(plant));
    return m;
  }, [planRows]);
  const seasonMax = useMemo(
    () => Math.max(30, ...[...maturityById.values()]),
    [maturityById],
  );
  const readyCount = useMemo(() => {
    if (seasonDay === null) return 0;
    let n = 0;
    for (const { plant, count } of planRows) {
      if (seasonDay >= (maturityById.get(plant.id) ?? 60)) n += count;
    }
    return n;
  }, [seasonDay, planRows, maturityById]);

  /* --- Mutators ---------------------------------------------------------- */

  function bump(id: string, delta: number) {
    setQty((prev) => {
      const next = { ...prev };
      const v = (next[id] ?? 0) + delta;
      if (v <= 0) delete next[id];
      else next[id] = Math.min(v, 99);
      return next;
    });
  }

  function addPlant(id: string) {
    if (!id) return;
    setQty((prev) => (prev[id] ? prev : { ...prev, [id]: 1 }));
    setPickId("");
  }

  function addFromSaved() {
    setQty((prev) => {
      const next = { ...prev };
      for (const id of saved) if (!next[id]) next[id] = 1;
      return next;
    });
  }

  const savedNotYetAdded = saved.filter((id) => (qty[id] ?? 0) === 0);

  /** Copy a link that reopens this exact plan (bed size + quantities). */
  async function copyShareLink() {
    const params = new URLSearchParams();
    params.set("tab", "bed");
    params.set("w", String(widthFt));
    params.set("l", String(lengthFt));
    const p = planRows.map((r) => `${r.plant.id}:${r.count}`).join(",");
    if (p) params.set("p", p);
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/garden?${params.toString()}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — quietly skip.
    }
  }

  /* --- Render ------------------------------------------------------------ */

  return (
    <div>
      <p className="text-sm text-soil-soft">
        Size your raised bed, add plants, and see — to scale — how many will
        comfortably fit.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[20rem_1fr]">
        {/* ---------------- Controls column ---------------- */}
        <div className="flex flex-col gap-6">
          {/* Bed size */}
          <fieldset className="rounded-xl border border-line bg-cream-deep p-5">
            <legend className="px-1 text-sm font-medium text-garden">
              Bed size
            </legend>

            <div className="mt-2 flex items-end gap-3">
              <label className="flex-1">
                <span className="block text-xs font-medium text-soil-soft">
                  Width (ft)
                </span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={widthDraft ?? String(widthFt)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setWidthDraft(raw);
                    const n = Number(raw);
                    if (raw !== "" && Number.isFinite(n) && n >= 1 && n <= 20) {
                      setWidthFt(Math.round(n));
                    }
                  }}
                  onBlur={() => {
                    if (widthDraft !== null) {
                      setWidthFt(clampFt(Number(widthDraft)));
                      setWidthDraft(null);
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2 text-soil focus:border-leaf focus:outline-none focus:ring-2 focus:ring-sage-soft"
                />
              </label>
              <span
                aria-hidden="true"
                className="pb-2 text-soil-soft"
              >
                ×
              </span>
              <label className="flex-1">
                <span className="block text-xs font-medium text-soil-soft">
                  Length (ft)
                </span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  step={1}
                  value={lengthDraft ?? String(lengthFt)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setLengthDraft(raw);
                    const n = Number(raw);
                    if (raw !== "" && Number.isFinite(n) && n >= 1 && n <= 20) {
                      setLengthFt(Math.round(n));
                    }
                  }}
                  onBlur={() => {
                    if (lengthDraft !== null) {
                      setLengthFt(clampFt(Number(lengthDraft)));
                      setLengthDraft(null);
                    }
                  }}
                  className="mt-1 w-full rounded-lg border border-line bg-cream px-3 py-2 text-soil focus:border-leaf focus:outline-none focus:ring-2 focus:ring-sage-soft"
                />
              </label>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const active = p.widthFt === widthFt && p.lengthFt === lengthFt;
                return (
                  <button
                    key={p.label}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setWidthFt(p.widthFt);
                      setLengthFt(p.lengthFt);
                      setWidthDraft(null);
                      setLengthDraft(null);
                    }}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft ${
                      active
                        ? "bg-garden text-cream"
                        : "border border-sage text-garden hover:bg-sage-soft"
                    }`}
                  >
                    {p.label} ft
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Plants */}
          <fieldset className="rounded-xl border border-line bg-cream-deep p-5">
            <legend className="px-1 text-sm font-medium text-garden">
              Plants
            </legend>

            {planRows.length === 0 ? (
              <p className="mt-2 text-sm text-soil-soft">
                No plants yet — add one below.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-2">
                {planRows.map(({ plant, count, spacingIn }) => (
                  <li
                    key={plant.id}
                    className="flex items-center gap-3 rounded-lg border border-line bg-cream px-3 py-2"
                  >
                    <span aria-hidden="true">
                      <VeggieIcon
                        emoji={plant.emoji}
                        name={plant.name}
                        size={26}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-soil">
                        {plant.name}
                      </span>
                      <span className="block text-xs text-soil-soft">
                        {spacingIn}&Prime; apart
                      </span>
                    </span>
                    <QtyStepper
                      name={plant.name}
                      count={count}
                      onDec={() => bump(plant.id, -1)}
                      onInc={() => bump(plant.id, +1)}
                    />
                  </li>
                ))}
              </ul>
            )}

            {/* Add-from-saved shortcut */}
            {savedNotYetAdded.length > 0 ? (
              <button
                type="button"
                onClick={addFromSaved}
                className="mt-3 w-full rounded-lg border border-sage px-3 py-2 text-sm font-medium text-garden transition-colors hover:bg-sage-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
              >
                <span aria-hidden="true">＋ </span>
                Add my {savedNotYetAdded.length} saved plant
                {savedNotYetAdded.length === 1 ? "" : "s"}
              </button>
            ) : null}

            {/* Picker: add any plant from the dataset */}
            <div className="mt-3 flex gap-2">
              <label className="sr-only" htmlFor="bed-plant-picker">
                Add a plant
              </label>
              <select
                id="bed-plant-picker"
                value={pickId}
                onChange={(e) => setPickId(e.target.value)}
                disabled={addablePlants.length === 0}
                className="min-w-0 flex-1 rounded-lg border border-line bg-cream px-3 py-2 text-sm text-soil focus:border-leaf focus:outline-none focus:ring-2 focus:ring-sage-soft disabled:opacity-50"
              >
                <option value="">
                  {addablePlants.length === 0
                    ? "All plants added"
                    : "Add a plant…"}
                </option>
                {addablePlants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => addPlant(pickId)}
                disabled={!pickId}
                className="rounded-lg bg-carrot px-4 py-2 text-sm font-medium text-soil transition-colors hover:bg-carrot-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </fieldset>
        </div>

        {/* ---------------- Diagram column ---------------- */}
        {/* #bed-print-area: printing this tab outputs just the plan (see
            globals.css @media print) — a nursery-ready sheet. */}
        <div id="bed-print-area" className="flex flex-col gap-4">
          {hasPlants ? (
            <>
              {/* Print-only masthead + shopping list. */}
              <div className="hidden print:block">
                <h2 className="text-2xl font-display">
                  🌱 Garden Grow — bed plan
                </h2>
                <ul className="mt-2 text-sm">
                  {planRows.map((r) => (
                    <li key={r.plant.id}>
                      {r.count}× {r.plant.name} — {r.spacingIn}&Prime; apart
                    </li>
                  ))}
                </ul>
              </div>
              <BedReadout
                widthFt={widthFt}
                lengthFt={lengthFt}
                placed={layout.placed}
                requested={layout.requested}
                areaUsedPct={layout.areaUsedPct}
                verdict={layout.verdict}
                overflow={layout.overflow}
              />
              <div className="rounded-xl border border-line bg-cream-deep px-5 py-3 print:hidden">
                <div className="flex flex-wrap items-center gap-3">
                  <label
                    htmlFor="season-scrubber"
                    className="text-sm font-medium text-garden"
                  >
                    Season view
                  </label>
                  <span aria-hidden="true" className="text-sm">
                    🌱
                  </span>
                  <input
                    id="season-scrubber"
                    type="range"
                    min={0}
                    max={seasonMax}
                    step={1}
                    value={seasonDay ?? seasonMax}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setSeasonDay(v >= seasonMax ? null : v);
                    }}
                    className="min-w-0 flex-1 accent-garden"
                    aria-valuetext={
                      seasonDay === null
                        ? "Full grown"
                        : `Day ${seasonDay} of ${seasonMax}`
                    }
                  />
                  <span aria-hidden="true" className="text-sm">
                    🌻
                  </span>
                </div>
                <p className="mt-1 text-xs text-soil-soft" aria-live="polite">
                  {seasonDay === null
                    ? `Full grown (day ${seasonMax}) — drag back to watch the season unfold.`
                    : `Day ${seasonDay} — ${readyCount}/${layout.requested} plants ready to harvest. Dashed rings show each plant's full-grown footprint.`}
                </p>
              </div>
              <BedDiagram
                layout={layout}
                seasonDay={seasonDay}
                maturityById={maturityById}
              />
              <Legend />
              <FoeCallout foePairs={foePairs} />
              <div className="flex flex-wrap gap-2 print:hidden">
                <button
                  type="button"
                  onClick={copyShareLink}
                  className="rounded-lg border border-sage px-4 py-2 text-sm font-medium text-garden transition-colors hover:bg-sage-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
                >
                  {copied ? "✓ Link copied" : "🔗 Copy link to this plan"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-lg border border-sage px-4 py-2 text-sm font-medium text-garden transition-colors hover:bg-sage-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
                >
                  🖨️ Print plan
                </button>
              </div>
            </>
          ) : (
            <EmptyState
              hasSaved={saved.length > 0}
              onAddSaved={addFromSaved}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- *
 * Readout
 * ------------------------------------------------------------------------- */

function BedReadout({
  widthFt,
  lengthFt,
  placed,
  requested,
  areaUsedPct,
  verdict,
  overflow,
}: {
  widthFt: number;
  lengthFt: number;
  placed: number;
  requested: number;
  areaUsedPct: number;
  verdict: BedVerdict;
  overflow: number;
}) {
  const copy = VERDICT_COPY[verdict];
  return (
    <div
      className="rounded-xl border border-line bg-cream-deep p-5"
      aria-live="polite"
    >
      <p className="text-sm text-soil-soft">
        Your{" "}
        <span className="font-medium text-soil">
          {widthFt}×{lengthFt} ft
        </span>{" "}
        bed · {placed}/{requested} plants ·{" "}
        {Math.round(areaUsedPct)}% full ·{" "}
        <span className={`font-medium ${copy.tone}`}>{copy.label}</span>
      </p>
      <p className={`mt-1 font-display text-lg ${copy.tone}`}>
        {copy.line(overflow)}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------------- *
 * To-scale SVG diagram
 * ------------------------------------------------------------------------- */

/** A hover/tap-focused plant's companion thread to a related neighbor. */
type Thread = {
  toKey: string;
  toPlantId: string;
  kind: "friend" | "foe";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

function placementKey(p: { plantId: string; instance: number }): string {
  return `${p.plantId}-${p.instance}`;
}

function BedDiagram({
  layout,
  seasonDay,
  maturityById,
}: {
  layout: ReturnType<typeof layoutBed>;
  /** Null = mature view; a number = "day N" of the season simulation. */
  seasonDay: number | null;
  maturityById: Map<string, number>;
}) {
  const { bedWidthIn, bedLengthIn, placements } = layout;

  // Hover (desktop) or tap (touch) focuses a plant: its circle highlights,
  // companion threads draw to neighbors, and the inspector card fills in.
  const [focusKey, setFocusKey] = useState<string | null>(null);
  const focus = placements.find((p) => placementKey(p) === focusKey) ?? null;

  /** Threads from the focused plant to the NEAREST instance of each related
   *  species — nearest only, so a bed of qty-8 carrots isn't spaghetti. */
  const threads = useMemo<Thread[]>(() => {
    if (!focus) return [];
    const best = new Map<string, { t: Thread; d2: number }>();
    for (const q of placements) {
      if (q.plantId === focus.plantId) continue;
      const kind = areFoes(focus.plantId, q.plantId)
        ? ("foe" as const)
        : areFriends(focus.plantId, q.plantId)
          ? ("friend" as const)
          : null;
      if (!kind) continue;
      const d2 = (q.xIn - focus.xIn) ** 2 + (q.yIn - focus.yIn) ** 2;
      const cur = best.get(q.plantId);
      if (!cur || d2 < cur.d2) {
        best.set(q.plantId, {
          d2,
          t: {
            toKey: placementKey(q),
            toPlantId: q.plantId,
            kind,
            x1: focus.xIn,
            y1: focus.yIn,
            x2: q.xIn,
            y2: q.yIn,
          },
        });
      }
    }
    return [...best.values()].map((v) => v.t);
  }, [focus, placements]);

  // Compute a uniform px-per-inch scale that fits the bed inside the panel.
  const scale = useMemo(() => {
    const w = bedWidthIn > 0 ? bedWidthIn : 1;
    const h = bedLengthIn > 0 ? bedLengthIn : 1;
    return Math.min(DIAGRAM_MAX_W / w, DIAGRAM_MAX_H / h);
  }, [bedWidthIn, bedLengthIn]);

  const bedW = bedWidthIn * scale;
  const bedH = bedLengthIn * scale;
  const svgW = bedW + DIAGRAM_PAD * 2;
  const svgH = bedH + DIAGRAM_PAD * 2;

  // Foot gridlines.
  const widthFt = bedWidthIn / INCHES_PER_FOOT;
  const lengthFt = bedLengthIn / INCHES_PER_FOOT;
  const vLines: number[] = [];
  for (let f = 1; f < widthFt; f++) vLines.push(f);
  const hLines: number[] = [];
  for (let f = 1; f < lengthFt; f++) hLines.push(f);

  const ftPx = INCHES_PER_FOOT * scale;

  const targetKeys = new Set(threads.map((t) => t.toKey));

  return (
    <div className="flex flex-col gap-3">
      <BedInspector focus={focus} threads={threads} />
      <div className="overflow-x-auto rounded-xl border border-line bg-cream-deep p-4">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        style={{ maxWidth: svgW, height: "auto", display: "block", margin: "0 auto" }}
        role="img"
        aria-label={`To-scale diagram of a ${widthFt} by ${lengthFt} foot bed with ${layout.placed} of ${layout.requested} plants placed.`}
        onClick={() => setFocusKey(null)}
      >
        <defs>
          {/* Tiled soil speckle — deterministic texture, no randomness. */}
          <pattern
            id="gg-soil"
            patternUnits="userSpaceOnUse"
            width={26}
            height={26}
          >
            <rect width={26} height={26} fill="#7D5F45" />
            <circle cx={5} cy={7} r={1.3} fill="#6A4F38" />
            <circle cx={17} cy={4} r={1} fill="#93765B" />
            <circle cx={21} cy={16} r={1.4} fill="#6A4F38" />
            <circle cx={9} cy={20} r={1} fill="#93765B" />
            <circle cx={14} cy={12} r={0.9} fill="#5E4632" />
          </pattern>
        </defs>

        <g transform={`translate(${DIAGRAM_PAD} ${DIAGRAM_PAD})`}>
          {/* Wooden raised-bed frame — drawn OUTSIDE the soil rect so the
              inner area stays exactly to scale. Side planks first, then the
              top/bottom planks overlap them like real butt joints. */}
          <g>
            <rect
              x={-FRAME_PX}
              y={-FRAME_PX}
              width={FRAME_PX}
              height={bedH + FRAME_PX * 2}
              rx={2.5}
              fill="#A9805C"
              stroke="#6E543C"
              strokeWidth={1}
            />
            <rect
              x={bedW}
              y={-FRAME_PX}
              width={FRAME_PX}
              height={bedH + FRAME_PX * 2}
              rx={2.5}
              fill="#A9805C"
              stroke="#6E543C"
              strokeWidth={1}
            />
            <rect
              x={-FRAME_PX}
              y={-FRAME_PX}
              width={bedW + FRAME_PX * 2}
              height={FRAME_PX}
              rx={2.5}
              fill="#B98F6B"
              stroke="#6E543C"
              strokeWidth={1}
            />
            <rect
              x={-FRAME_PX}
              y={bedH}
              width={bedW + FRAME_PX * 2}
              height={FRAME_PX}
              rx={2.5}
              fill="#94704F"
              stroke="#6E543C"
              strokeWidth={1}
            />
          </g>

          {/* Soil */}
          <rect x={0} y={0} width={bedW} height={bedH} fill="url(#gg-soil)" />

          {/* Foot gridlines — faint dibber lines pressed into the soil */}
          {vLines.map((f) => (
            <line
              key={`v${f}`}
              x1={f * ftPx}
              y1={0}
              x2={f * ftPx}
              y2={bedH}
              stroke="rgba(247, 244, 236, 0.28)"
              strokeWidth={1}
              strokeDasharray="2 6"
            />
          ))}
          {hLines.map((f) => (
            <line
              key={`h${f}`}
              x1={0}
              y1={f * ftPx}
              x2={bedW}
              y2={f * ftPx}
              stroke="rgba(247, 244, 236, 0.28)"
              strokeWidth={1}
              strokeDasharray="2 6"
            />
          ))}

          {/* Companion threads from the focused plant: green arcs to friends,
              rust dashed arcs to foes (nearest instance of each species). */}
          {threads.map((t) => {
            const x1 = t.x1 * scale;
            const y1 = t.y1 * scale;
            const x2 = t.x2 * scale;
            const y2 = t.y2 * scale;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;
            const off = Math.min(24, len * 0.18);
            const cxp = (x1 + x2) / 2 - (dy / len) * off;
            const cyp = (y1 + y2) / 2 + (dx / len) * off;
            return (
              <path
                key={t.toKey}
                className="gg-bed-thread"
                d={`M ${x1} ${y1} Q ${cxp} ${cyp} ${x2} ${y2}`}
                fill="none"
                stroke={t.kind === "friend" ? "#4A7C59" : "#C5713A"}
                strokeWidth={2}
                strokeDasharray={t.kind === "foe" ? "5 4" : undefined}
                strokeLinecap="round"
                opacity={0.9}
                pointerEvents="none"
              />
            );
          })}

          {/* Plant footprints. Each spot's position lives in a CSS transform
              so layout reflows GLIDE (transition on .gg-bed-spot); each spot's
              content sprouts in on mount (.gg-bed-pop, staggered). Stable
              plantId-instance keys mean existing plants never re-pop. */}
          {placements.map((p, i) => {
            const cx = p.xIn * scale;
            const cy = p.yIn * scale;
            const r = (p.diameterIn / 2) * scale;
            const plant = getPlantById(p.plantId);
            const key = placementKey(p);
            const isFocus = key === focusKey;
            const isTarget = targetKeys.has(key);

            // Season growth: sqrt eases the fast early growth; floor keeps
            // seedlings visible. Ready plants get a golden harvest ring.
            const maturity = maturityById.get(p.plantId) ?? 60;
            const growth =
              seasonDay === null
                ? 1
                : Math.max(0.12, Math.sqrt(Math.min(1, seasonDay / maturity)));
            const drawnR = Math.max(4, r * growth);
            const ready = seasonDay !== null && seasonDay >= maturity;
            // Icon roughly fills the (current) circle, readable when tiny.
            const iconSize = Math.max(8, Math.min(drawnR * 1.5, 40));
            return (
              <g
                key={key}
                className="gg-bed-spot"
                style={{
                  transform: `translate(${cx}px, ${cy}px)`,
                  cursor: "pointer",
                }}
                onMouseEnter={() => setFocusKey(key)}
                onMouseLeave={() =>
                  setFocusKey((cur) => (cur === key ? null : cur))
                }
                onClick={(e) => {
                  // Tap-to-inspect on touch; tap again (or the soil) to clear.
                  e.stopPropagation();
                  setFocusKey((cur) => (cur === key ? null : key));
                }}
              >
                {/* Native SVG tooltip: hover a circle to identify it. */}
                <title>
                  {`${plant?.name ?? p.plantId} — ${p.diameterIn}″ footprint${p.fits ? "" : " (no room)"}`}
                </title>
                <g
                  className="gg-bed-pop"
                  style={{ animationDelay: `${Math.min(i * 45, 600)}ms` }}
                >
                  {/* Ghost of the full-grown footprint while mid-season. */}
                  {growth < 1 ? (
                    <circle
                      cx={0}
                      cy={0}
                      r={Math.max(r, 4)}
                      fill="none"
                      stroke="rgba(247, 244, 236, 0.45)"
                      strokeWidth={1}
                      strokeDasharray="3 5"
                    />
                  ) : null}
                  <circle
                    className="gg-bed-circle"
                    cx={0}
                    cy={0}
                    r={drawnR}
                    fill={p.fits ? "#D4E2CD" : "#F6D9C2"}
                    fillOpacity={isFocus || isTarget ? 1 : 0.85}
                    stroke={
                      isFocus
                        ? "#2F6B3D"
                        : ready
                          ? "#E08A4B"
                          : p.fits
                            ? "#4A7C59"
                            : "#C5713A"
                    }
                    strokeWidth={isFocus || isTarget ? 3 : ready ? 2.5 : p.fits ? 1.5 : 2}
                    strokeDasharray={p.fits ? undefined : "4 3"}
                  />
                  {plant ? (
                    <foreignObject
                      x={-iconSize / 2}
                      y={-iconSize / 2}
                      width={iconSize}
                      height={iconSize}
                      style={{ overflow: "visible", pointerEvents: "none" }}
                    >
                      <div
                        style={{
                          width: iconSize,
                          height: iconSize,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <VeggieIcon
                          emoji={plant.emoji}
                          name={plant.name}
                          size={iconSize}
                        />
                      </div>
                    </foreignObject>
                  ) : null}
                </g>
              </g>
            );
          })}
        </g>

        {/* Dimension labels */}
        <text
          x={DIAGRAM_PAD + bedW / 2}
          y={16}
          textAnchor="middle"
          fontSize={13}
          fill="#5A5147"
          fontWeight={600}
        >
          {formatFt(widthFt)} ft
        </text>
        <text
          x={14}
          y={DIAGRAM_PAD + bedH / 2}
          textAnchor="middle"
          fontSize={13}
          fill="#5A5147"
          fontWeight={600}
          transform={`rotate(-90 14 ${DIAGRAM_PAD + bedH / 2})`}
        >
          {formatFt(lengthFt)} ft
        </text>
      </svg>
      </div>
    </div>
  );
}

/**
 * BedInspector — the readout for the hovered/tapped plant: identity, footprint,
 * harvest time, and which bedmates it loves or clashes with. Fixed-position
 * card (not a floating tooltip) so it works identically for mouse and touch.
 */
function BedInspector({
  focus,
  threads,
}: {
  focus: { plantId: string; diameterIn: number; fits: boolean } | null;
  threads: Thread[];
}) {
  const plant = focus ? getPlantById(focus.plantId) : undefined;

  if (!focus || !plant) {
    return (
      <p className="rounded-lg border border-dashed border-line px-3 py-2 text-xs text-soil-soft print:hidden">
        Hover or tap a plant in the bed to inspect it.
      </p>
    );
  }

  const namesFor = (kind: "friend" | "foe") => [
    ...new Set(
      threads
        .filter((t) => t.kind === kind)
        .map((t) => getPlantById(t.toPlantId)?.name ?? t.toPlantId),
    ),
  ];
  const friendNames = namesFor("friend");
  const foeNames = namesFor("foe");

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-sage bg-cream px-3 py-2 text-xs text-soil print:hidden"
      aria-live="polite"
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        <VeggieIcon emoji={plant.emoji} name={plant.name} size={20} />
        {plant.name}
      </span>
      <span className="text-soil-soft">{focus.diameterIn}&Prime; footprint</span>
      <span className="text-soil-soft">harvest in {plant.growingDuration}</span>
      {friendNames.length > 0 ? (
        <span className="text-leaf">♥ {friendNames.join(", ")}</span>
      ) : null}
      {foeNames.length > 0 ? (
        <span className="text-carrot-deep">⚡ {foeNames.join(", ")}</span>
      ) : null}
      {!focus.fits ? (
        <span className="font-medium text-carrot-deep">no room in bed</span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------- *
 * Legend, stepper, empty state
 * ------------------------------------------------------------------------- */

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-soil-soft">
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block h-3 w-3 rounded-full border-2 border-leaf bg-sage-soft"
        />
        Fits comfortably
      </span>
      <span className="inline-flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-block h-3 w-3 rounded-full border-2 border-dashed border-carrot-deep bg-carrot/30"
        />
        No room (overflow)
      </span>
      <span>
        Each circle = the room a plant needs (row spacing); foes sit apart.
        Hover one: <span className="text-leaf">green threads</span> = friends,{" "}
        <span className="text-carrot-deep">rust dashes</span> = foes.
      </span>
    </div>
  );
}

/**
 * Names exactly WHICH foe pairs the layout engine kept apart, so the
 * separation isn't invisible magic in the diagram.
 */
function FoeCallout({ foePairs }: { foePairs: [string, string][] }) {
  if (foePairs.length === 0) return null;
  const names = (id: string) => getPlantById(id)?.name ?? id;
  return (
    <p className="rounded-lg border border-sage bg-sage-soft px-3 py-2 text-xs text-garden">
      <span aria-hidden="true">🚧 </span>
      <span className="font-medium">Kept apart:</span>{" "}
      {foePairs.map(([a, b], i) => (
        <span key={`${a}|${b}`}>
          {i > 0 ? " · " : ""}
          {names(a)} ↔ {names(b)}
        </span>
      ))}
    </p>
  );
}

function QtyStepper({
  name,
  count,
  onDec,
  onInc,
}: {
  name: string;
  count: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={onDec}
        aria-label={`Remove one ${name}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-sage text-garden transition-colors hover:bg-sage-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
      >
        <span aria-hidden="true" className="text-base leading-none">
          −
        </span>
      </button>
      <span
        className="w-6 text-center text-sm font-medium tabular-nums text-soil"
        aria-label={`${count} ${name}`}
      >
        {count}
      </span>
      <button
        type="button"
        onClick={onInc}
        aria-label={`Add one ${name}`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-sage text-garden transition-colors hover:bg-sage-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
      >
        <span aria-hidden="true" className="text-base leading-none">
          ＋
        </span>
      </button>
    </span>
  );
}

function EmptyState({
  hasSaved,
  onAddSaved,
}: {
  hasSaved: boolean;
  onAddSaved: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl border border-line bg-cream-deep p-10 text-center">
      <div className="text-5xl" aria-hidden="true">
        📐
      </div>
      <h2 className="mt-4 text-2xl font-display">Design your bed</h2>
      <p className="mx-auto mt-2 max-w-md text-soil-soft">
        Add a few plants to see them laid out to scale in your bed. Start from
        your saved garden, or pick any plant from the list.
      </p>
      {hasSaved ? (
        <button
          type="button"
          onClick={onAddSaved}
          className="mt-6 inline-block rounded-lg bg-carrot px-5 py-2.5 font-medium text-soil transition-colors hover:bg-carrot-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft"
        >
          Add my saved plants
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------- *
 * Helpers
 * ------------------------------------------------------------------------- */

/** Clamp a feet value to the sensible 1–20 range (bad input floors to 1). */
function clampFt(v: number): number {
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.min(Math.round(v), 20);
}

/**
 * Parse a shared bed plan out of the URL (?w=4&l=8&p=tomato:2,basil:4).
 * Returns null when the URL carries no plan at all; unknown plant ids and
 * bad quantities are dropped, dimensions are clamped like the inputs.
 */
function parseUrlPlan(params: {
  get(name: string): string | null;
}): { widthFt: number; lengthFt: number; qty: QtyMap } | null {
  const w = params.get("w");
  const l = params.get("l");
  const p = params.get("p");
  if (w === null && l === null && p === null) return null;

  const qty: QtyMap = {};
  if (p) {
    for (const part of p.split(",")) {
      const [id, n] = part.split(":");
      const count = parseInt(n ?? "", 10);
      if (id && getPlantById(id) && Number.isFinite(count) && count > 0) {
        qty[id] = Math.min(count, 99);
      }
    }
  }
  return {
    widthFt: clampFt(Number(w ?? 4)),
    lengthFt: clampFt(Number(l ?? 8)),
    qty,
  };
}

/** Render a foot count, dropping a trailing ".0" for whole numbers. */
function formatFt(ft: number): string {
  return Number.isInteger(ft) ? String(ft) : ft.toFixed(1);
}
