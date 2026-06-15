/**
 * Companion-planting helpers for the "My Garden" feature.
 *
 * Pure functions over the static `plants` dataset — no React, no side effects.
 * Given the set of plant ids a gardener has saved, we surface:
 *   - conflicts: pairs of saved plants that are companion-planting FOES
 *   - suggestions: unsaved plants that would be good additions (friends of
 *     several already-saved plants)
 *
 * All relationships are sourced from each plant's `companions` field in
 * `data/plants.ts`, where foe/friend relationships are kept symmetric.
 */

import { plants, getPlantById, type Plant } from "@/data/plants";

/** Re-export so callers can grab everything companion-related from one module. */
export { getPlantById };
export type { Plant };

/**
 * Module-level id → Plant index, built once from the static dataset. The
 * exported `getPlantById` is a plants.find() linear scan; companionReport does
 * O(n^2) foe/friend lookups, so routing those through this Map turns each
 * lookup from O(n) to O(1) (companionReport from ~O(n^3) to O(n^2)).
 */
const PLANT_BY_ID: Map<string, Plant> = new Map(plants.map((p) => [p.id, p]));

/** The friends list for a plant id (empty array for unknown ids). */
export function friendsOf(id: string): string[] {
  return PLANT_BY_ID.get(id)?.companions.friends ?? [];
}

/** The foes list for a plant id (empty array for unknown ids). */
export function foesOf(id: string): string[] {
  return PLANT_BY_ID.get(id)?.companions.foes ?? [];
}

/** Are two plant ids companion-planting foes? (order-independent) */
export function areFoes(a: string, b: string): boolean {
  return foesOf(a).includes(b) || foesOf(b).includes(a);
}

/** Are two plant ids companion-planting friends? (order-independent) */
export function areFriends(a: string, b: string): boolean {
  return friendsOf(a).includes(b) || friendsOf(b).includes(a);
}

/** An unordered foe pairing between two saved plant ids. */
export interface CompanionConflict {
  a: string;
  b: string;
}

export interface CompanionReport {
  /** Unordered, unique pairs among the saved ids that are foes. */
  conflicts: CompanionConflict[];
  /**
   * Plant ids NOT yet saved that are friends of 2+ saved plants, sorted by how
   * many saved plants they befriend (descending), capped at 6.
   */
  suggestions: string[];
}

/** Maximum number of suggestions returned by {@link companionReport}. */
const MAX_SUGGESTIONS = 6;
/** A plant must befriend at least this many saved plants to be suggested. */
const MIN_FRIEND_OVERLAP = 2;

/**
 * Build a companion-planting report for a set of saved plant ids.
 *
 * Pure: depends only on its `ids` argument and the static dataset.
 *
 * - `conflicts`: every unordered, unique pair of *distinct, valid, saved* ids
 *   that are foes of each other. Each pair appears once with `a` < `b`
 *   (lexicographically) for stable output.
 * - `suggestions`: ids of plants that are NOT already saved and that are
 *   friends of at least {@link MIN_FRIEND_OVERLAP} saved plants. Sorted by that
 *   friend count (descending), then alphabetically for ties, capped at
 *   {@link MAX_SUGGESTIONS}.
 *
 * Unknown ids and duplicates in the input are ignored.
 *
 * @example
 *   companionReport(["tomato", "potato"]).conflicts
 *   // => [{ a: "potato", b: "tomato" }]   (nightshade foes)
 */
export function companionReport(ids: string[]): CompanionReport {
  // Normalize: keep only known ids, de-duplicate, preserve a stable set.
  const saved = Array.from(new Set(ids)).filter((id) => PLANT_BY_ID.has(id));
  const savedSet = new Set(saved);

  // --- conflicts: unique unordered foe pairs among saved plants ---
  const conflicts: CompanionConflict[] = [];
  const sortedSaved = [...saved].sort();
  for (let i = 0; i < sortedSaved.length; i++) {
    for (let j = i + 1; j < sortedSaved.length; j++) {
      const a = sortedSaved[i];
      const b = sortedSaved[j];
      if (areFoes(a, b)) {
        conflicts.push({ a, b });
      }
    }
  }

  // --- suggestions: unsaved plants that are friends of 2+ saved plants ---
  // Count, for each candidate plant, how many saved plants list it as a friend
  // (using the symmetric relationship via areFriends).
  const friendCount = new Map<string, number>();
  for (const candidate of plants) {
    if (savedSet.has(candidate.id)) continue; // skip already-saved
    let count = 0;
    for (const savedId of saved) {
      if (areFriends(candidate.id, savedId)) count++;
    }
    if (count >= MIN_FRIEND_OVERLAP) {
      friendCount.set(candidate.id, count);
    }
  }

  const suggestions = Array.from(friendCount.entries())
    .sort((x, y) => {
      // Higher friend-count first; alphabetical id for ties (stable output).
      if (y[1] !== x[1]) return y[1] - x[1];
      return x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0;
    })
    .slice(0, MAX_SUGGESTIONS)
    .map(([id]) => id);

  return { conflicts, suggestions };
}
