/**
 * bedLayout — pure, framework-free geometry for a to-scale garden-bed designer.
 *
 * NO React, NO DOM, NO side effects. This module turns a bed's physical
 * dimensions plus a list of plants (each with a per-plant spacing footprint)
 * into concrete circle placements in INCH coordinates, ready for a UI layer to
 * render to scale.
 *
 * Model
 * -----
 * Every plant instance is treated as a circle whose diameter equals the plant's
 * recommended in-row spacing (the "footprint" — how much elbow room one plant
 * needs). Circles are packed with a simple deterministic shelf/row algorithm:
 *
 *   - lay circles left → right across the bed width,
 *   - when the next circle won't fit on the current row, wrap to a new row,
 *   - the new row starts below the current one by the CURRENT row's tallest
 *     circle (classic "shelf" / first-fit-decreasing-by-height packing).
 *
 * Items are sorted largest-diameter-first before packing so big plants seed the
 * row heights and smaller plants tuck into the remaining space — this gives
 * tighter, more stable shelves than insertion order would.
 *
 * Everything here is fully deterministic: same inputs always produce the same
 * placements (no randomness, no Date, no Math.random).
 */

/* ------------------------------------------------------------------------- *
 * Types
 * ------------------------------------------------------------------------- */

/** Physical bed dimensions, in inches. */
export type BedDims = {
  /** Bed width (the horizontal axis circles pack across), in inches. */
  widthIn: number;
  /** Bed length / depth (the vertical axis rows advance down), in inches. */
  lengthIn: number;
};

/** One row in the planting plan: a plant and how many of it to place. */
export type BedItem = {
  /** Plant id (kebab-case slug from the plants dataset). */
  plantId: string;
  /** Per-plant footprint diameter, in inches (typically from parseSpacingInches). */
  spacingIn: number;
  /** How many of this plant to place. */
  qty: number;
};

/** A single placed plant instance, as a circle in inch coordinates. */
export type Placement = {
  /** Which plant this circle is. */
  plantId: string;
  /**
   * 1-based index of this instance among all copies of the same plantId
   * (instance 1, 2, 3 … for qty copies). Useful as a stable React key.
   */
  instance: number;
  /** X of the circle's CENTER, in inches from the bed's left edge. */
  xIn: number;
  /** Y of the circle's CENTER, in inches from the bed's top edge. */
  yIn: number;
  /** Circle diameter, in inches (equals the item's spacingIn). */
  diameterIn: number;
  /** False when the circle extends past the bed's length (overflow). */
  fits: boolean;
};

/** Verdict bands for how full the bed is. */
export type BedVerdict = "roomy" | "snug" | "cramped" | "overcrowded";

/** Result of laying out a bed. */
export type BedLayout = {
  /** Every placed instance, in placement order (largest plants first). */
  placements: Placement[];
  /** Echo of the bed width used, in inches. */
  bedWidthIn: number;
  /** Echo of the bed length used, in inches. */
  bedLengthIn: number;
  /** Total instances requested (sum of qty across items). */
  requested: number;
  /** How many instances fit inside the bed (fits === true). */
  placed: number;
  /** How many instances did NOT fit (fits === false). */
  overflow: number;
  /**
   * Estimated share of the bed floor the plants' footprints consume, as a
   * percentage. See areaUsedPct note in layoutBed for the exact formula.
   * Can exceed 100 when plants are overcrowded.
   */
  areaUsedPct: number;
  /** Qualitative read of areaUsedPct (and overflow). */
  verdict: BedVerdict;
};

/* ------------------------------------------------------------------------- *
 * Spacing parsing
 * ------------------------------------------------------------------------- */

/** Fallback footprint, in inches, when a spacing string can't be parsed. */
const DEFAULT_SPACING_IN = 12;

/**
 * Parse a human spacing string into a single recommended footprint diameter
 * in INCHES.
 *
 * Handles the shapes used in the plants dataset, e.g.:
 *   "3-4 in"    → 4   (range → upper bound)
 *   "18-24 in"  → 24
 *   "12 in"     → 12
 *   "1-2 in"    → 2
 *   "8-12 in"   → 12
 *
 * Rules:
 *   - We pull every numeric token (including decimals) out of the string.
 *   - For a RANGE we use the UPPER bound — plants want the roomier end of the
 *     recommendation, and packing to the upper bound avoids overcrowding.
 *   - Unicode hyphens/dashes and "to" both read as range separators because the
 *     extraction is token-based, so we don't depend on the exact separator.
 *   - If nothing numeric is found, we fall back to DEFAULT_SPACING_IN (~12in).
 *
 * Deterministic and side-effect free.
 */
export function parseSpacingInches(spacing: string): number {
  if (typeof spacing !== "string") return DEFAULT_SPACING_IN;

  // Grab all numbers (ints or decimals) in order of appearance.
  const matches = spacing.match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return DEFAULT_SPACING_IN;

  const numbers = matches.map(Number).filter((n) => Number.isFinite(n) && n > 0);
  if (numbers.length === 0) return DEFAULT_SPACING_IN;

  // Upper bound of whatever numbers we found (handles "3-4", "18-24", "12").
  return Math.max(...numbers);
}

/* ------------------------------------------------------------------------- *
 * Verdict
 * ------------------------------------------------------------------------- */

/**
 * Map an area-used percentage (plus overflow) to a qualitative verdict.
 *
 * Thresholds (on areaUsedPct):
 *   < 70      → 'roomy'
 *   70  – 95  → 'snug'
 *   95  – 115 → 'cramped'
 *   > 115     → 'overcrowded'
 *
 * Any overflow (a plant that didn't fit) forces 'overcrowded' regardless of the
 * percentage — if something spilled off the bed, it's overcrowded by definition.
 */
function verdictFor(areaUsedPct: number, overflow: number): BedVerdict {
  if (overflow > 0) return "overcrowded";
  if (areaUsedPct < 70) return "roomy";
  if (areaUsedPct < 95) return "snug";
  if (areaUsedPct <= 115) return "cramped";
  return "overcrowded";
}

/* ------------------------------------------------------------------------- *
 * Layout
 * ------------------------------------------------------------------------- */

/**
 * Lay out a bed by packing each plant instance as a circle (diameter =
 * spacingIn) into the bed using deterministic shelf/row packing.
 *
 * Algorithm (shelf / first-fit-decreasing):
 *   1. Expand items into individual instances, then sort largest-diameter-first
 *      so big plants set the row heights and small plants fill the gaps.
 *   2. Walk left → right placing each circle. Track the cursor at the LEFT edge
 *      of the next circle's bounding box (cursorX) and the row's top (rowTop).
 *   3. If the circle's full width won't fit before the bed's right edge, wrap:
 *      drop rowTop down by the current row's tallest circle and reset cursorX.
 *   4. A circle's center is (cursorX + r, rowTop + r); advance cursorX by its
 *      diameter and grow the row's max height.
 *   5. fits = false when the circle's bottom edge (rowTop + diameter) exceeds
 *      the bed length. Overflow circles are still returned, positioned just
 *      past the bottom edge and flagged, so the UI can show the "doesn't fit /
 *      cramped" plants.
 *
 * Edge cases:
 *   - A circle WIDER than the whole bed can never fit horizontally; it's placed
 *     at cursorX 0 on its own row and will read as fits=false if it also
 *     overflows the length (which an oversized circle on a finite bed will).
 *   - Non-positive or non-finite dims/qtys/diameters are sanitized to safe
 *     values so the function never throws and always returns a layout.
 *
 * areaUsedPct formula (documented choice):
 *   We use the CIRCLE area of each footprint:
 *       sum over items of  π * (d/2)^2 * qty
 *   divided by the bed floor area (widthIn * lengthIn), times 100. This counts
 *   ALL requested instances (including overflow) so an over-stuffed plan reads
 *   well above 100%. Circle area (vs. bounding squares) reflects the real
 *   round canopy footprint and is the gentler, more realistic estimate.
 *
 * @returns a fully-populated BedLayout (never throws).
 */
/**
 * 2-color the foe graph so companion foes end up on opposite sides of the bed.
 * Bipartite BFS over the given plant ids; plants with no foe edge default to
 * camp 0. Odd cycles (non-bipartite) are handled best-effort.
 */
function computeFoeCamps(
  plantIds: string[],
  foePairs: ReadonlyArray<readonly [string, string]>,
): Map<string, number> {
  const ids = [...new Set(plantIds)];
  const adj = new Map<string, Set<string>>();
  for (const id of ids) adj.set(id, new Set());
  for (const [a, b] of foePairs) {
    if (adj.has(a) && adj.has(b)) {
      adj.get(a)!.add(b);
      adj.get(b)!.add(a);
    }
  }
  const camp = new Map<string, number>();
  for (const start of ids) {
    if (camp.has(start)) continue;
    camp.set(start, 0);
    const queue: string[] = [start];
    while (queue.length > 0) {
      const cur = queue.shift()!;
      const cc = camp.get(cur)!;
      for (const nb of adj.get(cur)!) {
        if (!camp.has(nb)) {
          camp.set(nb, cc === 0 ? 1 : 0);
          queue.push(nb);
        }
      }
    }
  }
  return camp;
}

export function layoutBed(
  dims: BedDims,
  items: BedItem[],
  opts?: { foePairs?: ReadonlyArray<readonly [string, string]> },
): BedLayout {
  // --- Sanitize bed dimensions (never throw on bad input). ---------------
  const bedWidthIn = sanitizePositive(dims?.widthIn, 0);
  const bedLengthIn = sanitizePositive(dims?.lengthIn, 0);

  // --- Expand items into individual instances. ---------------------------
  // Each instance remembers its 1-based index within its own plantId.
  type Instance = { plantId: string; instance: number; diameterIn: number };
  const instances: Instance[] = [];
  let requested = 0;

  const safeItems = Array.isArray(items) ? items : [];
  for (const item of safeItems) {
    const qty = Math.max(0, Math.floor(sanitizePositive(item?.qty, 0)));
    // A footprint must be a positive finite number; fall back if not.
    const diameterIn = sanitizePositive(item?.spacingIn, DEFAULT_SPACING_IN);
    for (let i = 0; i < qty; i++) {
      requested += 1;
      instances.push({
        plantId: String(item?.plantId ?? ""),
        instance: i + 1,
        diameterIn,
      });
    }
  }

  // --- Split plants into two "camps" so companion FOES land on opposite
  // sides of the bed. Camp is the PRIMARY sort key, so camp 0 packs into the
  // first rows (top) and camp 1 into the last rows (bottom) — opposite ends.
  const camp = computeFoeCamps(
    instances.map((i) => i.plantId),
    opts?.foePairs ?? [],
  );

  // --- Sort by camp, then largest-diameter-first (stable, deterministic). -
  instances.sort((a, b) => {
    const ca = camp.get(a.plantId) ?? 0;
    const cb = camp.get(b.plantId) ?? 0;
    if (ca !== cb) return ca - cb;
    if (b.diameterIn !== a.diameterIn) return b.diameterIn - a.diameterIn;
    if (a.plantId !== b.plantId) return a.plantId < b.plantId ? -1 : 1;
    return a.instance - b.instance;
  });

  // --- Foe lookup so we never backfill a plant right next to its foe. -----
  const foeKey = (a: string, b: string) => `${a}|${b}`;
  const foeSet = new Set<string>();
  for (const [a, b] of opts?.foePairs ?? []) {
    foeSet.add(foeKey(a, b));
    foeSet.add(foeKey(b, a));
  }

  // --- Row packing WITH GAP BACKFILL. ------------------------------------
  // Largest-first, each plant drops into the FIRST existing row that has (a)
  // horizontal room, (b) enough height, and (c) no foe of this plant — so the
  // small plants fill the empty side space beside the big ones instead of
  // overflowing, while foes still stay on separate rows. Otherwise it opens a
  // new row at the bottom.
  type Row = { top: number; height: number; cursorX: number; ids: Set<string> };
  const rows: Row[] = [];
  const placements: Placement[] = [];
  let placed = 0;
  let overflow = 0;

  for (const inst of instances) {
    const d = inst.diameterIn;
    const r = d / 2;

    let row: Row | undefined;
    for (const rw of rows) {
      if (rw.cursorX + d > bedWidthIn) continue; // no horizontal room
      if (d > rw.height) continue; // taller than this row's band
      let foeHere = false;
      for (const id of rw.ids) {
        if (foeSet.has(foeKey(inst.plantId, id))) {
          foeHere = true;
          break;
        }
      }
      if (foeHere) continue;
      row = rw;
      break;
    }

    if (!row) {
      const prev = rows[rows.length - 1];
      const top = prev ? prev.top + prev.height : 0;
      row = { top, height: d, cursorX: 0, ids: new Set() };
      rows.push(row);
    }

    const xIn = row.cursorX + r;
    const yIn = row.top + r;
    const fits = row.top + d <= bedLengthIn;

    placements.push({
      plantId: inst.plantId,
      instance: inst.instance,
      xIn,
      yIn,
      diameterIn: d,
      fits,
    });

    if (fits) placed += 1;
    else overflow += 1;

    row.cursorX += d;
    row.ids.add(inst.plantId);
  }

  // --- Area used percentage (circle-area model; see doc above). ----------
  const bedArea = bedWidthIn * bedLengthIn;
  let footprintArea = 0;
  for (const item of safeItems) {
    const qty = Math.max(0, Math.floor(sanitizePositive(item?.qty, 0)));
    const d = sanitizePositive(item?.spacingIn, DEFAULT_SPACING_IN);
    const rr = d / 2;
    footprintArea += Math.PI * rr * rr * qty;
  }
  const areaUsedPct = bedArea > 0 ? (footprintArea / bedArea) * 100 : 0;

  // --- Verdict. ----------------------------------------------------------
  const verdict = verdictFor(areaUsedPct, overflow);

  return {
    placements,
    bedWidthIn,
    bedLengthIn,
    requested,
    placed,
    overflow,
    areaUsedPct,
    verdict,
  };
}

/* ------------------------------------------------------------------------- *
 * Internal helpers
 * ------------------------------------------------------------------------- */

/**
 * Coerce a value to a finite, non-negative number, falling back when it's
 * missing, NaN, infinite, or negative. Keeps layoutBed total and crash-proof.
 */
function sanitizePositive(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
}
