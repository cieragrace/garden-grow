/**
 * bedPlan.ts — persists the Bed Designer's plan (bed size + plant quantities)
 * so a refresh or tab close doesn't discard a layout the user just tuned.
 *
 * Deliberately simpler than garden.ts/lastZone.ts: only BedDesigner reads this
 * (no cross-component subscribers), so it's a plain read/write pair — the
 * component lazy-inits from `readBedPlan()` and write-through-persists on
 * change. BedDesigner only mounts client-side (the Garden hub gates panels
 * behind mount), so reads never run during SSR.
 */

const BED_PLAN_KEY = "garden-grow:bed-plan";

export interface BedPlan {
  /** Bed width in feet. */
  widthFt: number;
  /** Bed length in feet. */
  lengthFt: number;
  /** Plant quantities keyed by plant id (only positive counts are kept). */
  qty: Record<string, number>;
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Read the stored plan, or null when absent/corrupt/unavailable. */
export function readBedPlan(): BedPlan | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(BED_PLAN_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") return null;
    const { widthFt, lengthFt, qty } = parsed as BedPlan;
    if (
      typeof widthFt !== "number" ||
      !Number.isFinite(widthFt) ||
      typeof lengthFt !== "number" ||
      !Number.isFinite(lengthFt) ||
      qty === null ||
      typeof qty !== "object"
    ) {
      return null;
    }
    const cleanQty: Record<string, number> = {};
    for (const [id, count] of Object.entries(qty)) {
      if (typeof count === "number" && Number.isFinite(count) && count > 0) {
        cleanQty[id] = Math.min(Math.floor(count), 99);
      }
    }
    return { widthFt, lengthFt, qty: cleanQty };
  } catch {
    return null;
  }
}

/** Persist the plan (best-effort; storage errors are swallowed). */
export function writeBedPlan(plan: BedPlan): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(BED_PLAN_KEY, JSON.stringify(plan));
  } catch {
    // Storage full / unavailable — the in-memory plan still works.
  }
}
