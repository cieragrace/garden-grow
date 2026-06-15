"use client";

/**
 * BedDesigner — a to-scale raised-bed layout tool (Garden hub "Bed Layout" tab).
 *
 * The user sets a bed size in FEET, then adds plants with quantity steppers.
 * Each plant's in-row seedSpacing (parsed to inches via parseSpacingInches) is
 * the diameter of its circular "footprint". We hand the bed dimensions (feet →
 * inches) and the plant quantities to the pure `layoutBed` engine, then render
 * the returned Placement[] as a to-scale SVG: a real rectangle with foot
 * gridlines, dimension labels, and one circle per plant instance sized to its
 * real spacing footprint. Overflow circles (fits === false) are drawn in a
 * warning amber so overcrowding is visible at a glance.
 *
 * All geometry lives in lib/bedLayout.ts; this component is purely the UI + the
 * input/quantity state.
 */

import { useMemo, useState } from "react";
import {
  layoutBed,
  parseSpacingInches,
  type BedItem,
  type BedVerdict,
} from "@/lib/bedLayout";
import { plants as ALL_PLANTS, getPlantById } from "@/data/plants";
import { useGarden } from "@/lib/useGarden";
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
const DIAGRAM_PAD = 28; // room for dimension labels around the bed rectangle

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

  // Bed dimensions, in FEET.
  const [widthFt, setWidthFt] = useState(4);
  const [lengthFt, setLengthFt] = useState(8);

  // Plant quantities, keyed by plant id. INTENTIONALLY seeded from `saved` once
  // on mount (lazy initializer) — after that, qty is user-owned local state and
  // deliberately does NOT track later changes to `saved` (e.g. saving/removing
  // plants from another tab while Bed stays mounted). This avoids clobbering the
  // counts the user has hand-tuned here; the "Add my saved plants" button is the
  // explicit, opt-in way to pull in newly-saved plants.
  const [qty, setQty] = useState<QtyMap>(() => {
    const seed: QtyMap = {};
    for (const id of saved) seed[id] = 1;
    return seed;
  });

  // The picker's currently-selected (not-yet-added) plant id.
  const [pickId, setPickId] = useState("");

  /** Plants currently in the plan, in dataset order, with resolved spacing. */
  const planRows = useMemo(() => {
    return ALL_PLANTS.filter((p) => (qty[p.id] ?? 0) > 0).map((plant) => ({
      plant,
      count: qty[plant.id],
      spacingIn: parseSpacingInches(plant.seedSpacing),
    }));
  }, [qty]);

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
    return layoutBed(dims, items);
  }, [widthFt, lengthFt, planRows]);

  /** Plants the user can still add (not already in the plan), for the picker. */
  const addablePlants = useMemo(
    () => ALL_PLANTS.filter((p) => (qty[p.id] ?? 0) === 0),
    [qty],
  );

  const hasPlants = planRows.length > 0;

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
                  value={widthFt}
                  onChange={(e) =>
                    setWidthFt(clampFt(Number(e.target.value)))
                  }
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
                  value={lengthFt}
                  onChange={(e) =>
                    setLengthFt(clampFt(Number(e.target.value)))
                  }
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
        <div className="flex flex-col gap-4">
          {hasPlants ? (
            <>
              <BedReadout
                widthFt={widthFt}
                lengthFt={lengthFt}
                placed={layout.placed}
                requested={layout.requested}
                areaUsedPct={layout.areaUsedPct}
                verdict={layout.verdict}
                overflow={layout.overflow}
              />
              <BedDiagram layout={layout} />
              <Legend />
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

function BedDiagram({ layout }: { layout: ReturnType<typeof layoutBed> }) {
  const { bedWidthIn, bedLengthIn, placements } = layout;

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

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-cream-deep p-4">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        style={{ maxWidth: svgW, height: "auto", display: "block", margin: "0 auto" }}
        role="img"
        aria-label={`To-scale diagram of a ${widthFt} by ${lengthFt} foot bed with ${layout.placed} of ${layout.requested} plants placed.`}
      >
        <g transform={`translate(${DIAGRAM_PAD} ${DIAGRAM_PAD})`}>
          {/* Soil bed */}
          <rect
            x={0}
            y={0}
            width={bedW}
            height={bedH}
            rx={10}
            fill="#EFE9DC"
            stroke="#A9C4A0"
            strokeWidth={2}
          />

          {/* Foot gridlines */}
          {vLines.map((f) => (
            <line
              key={`v${f}`}
              x1={f * ftPx}
              y1={0}
              x2={f * ftPx}
              y2={bedH}
              stroke="#D4E2CD"
              strokeWidth={1}
            />
          ))}
          {hLines.map((f) => (
            <line
              key={`h${f}`}
              x1={0}
              y1={f * ftPx}
              x2={bedW}
              y2={f * ftPx}
              stroke="#D4E2CD"
              strokeWidth={1}
            />
          ))}

          {/* Plant footprints */}
          {placements.map((p) => {
            const cx = p.xIn * scale;
            const cy = p.yIn * scale;
            const r = (p.diameterIn / 2) * scale;
            const plant = getPlantById(p.plantId);
            // Icon roughly fills the circle but stays readable when tiny.
            const iconSize = Math.max(10, Math.min(r * 1.5, 40));
            return (
              <g key={`${p.plantId}-${p.instance}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={Math.max(r, 4)}
                  fill={p.fits ? "#D4E2CD" : "#F6D9C2"}
                  fillOpacity={0.85}
                  stroke={p.fits ? "#4A7C59" : "#C5713A"}
                  strokeWidth={p.fits ? 1.5 : 2}
                  strokeDasharray={p.fits ? undefined : "4 3"}
                />
                {plant ? (
                  <foreignObject
                    x={cx - iconSize / 2}
                    y={cy - iconSize / 2}
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
      <span>Each circle = the plant&apos;s real spacing footprint.</span>
    </div>
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

/** Clamp a feet input to a sensible 1–20 range, defaulting bad input to 4. */
function clampFt(v: number): number {
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.min(Math.round(v), 20);
}

/** Render a foot count, dropping a trailing ".0" for whole numbers. */
function formatFt(ft: number): string {
  return Number.isInteger(ft) ? String(ft) : ft.toFixed(1);
}
