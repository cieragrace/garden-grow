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

/** Order-independent key for a plant pair: lexicographically sorted "a|b". */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/**
 * One-line explanations for companion relationships — WHY a pair clashes or
 * pairs well, so the UI can say more than "shouldn't share a bed".
 *
 * Foe pairs have full coverage (every foe edge in the dataset has a note);
 * friend notes cover the classic pairings and fall back to null elsewhere.
 */
const PAIR_NOTES: Record<string, string> = {
  // --- foes: full coverage -------------------------------------------------
  [pairKey("tomato", "sweet-corn")]:
    "Corn earworm and tomato fruitworm are the same moth — side by side, you double the buffet.",
  [pairKey("tomato", "broccoli")]:
    "Heavy-feeding brassicas outcompete tomatoes for the same nutrients.",
  [pairKey("tomato", "cauliflower")]:
    "Heavy-feeding brassicas outcompete tomatoes for the same nutrients.",
  [pairKey("tomato", "kale")]:
    "Heavy-feeding brassicas outcompete tomatoes for the same nutrients.",
  [pairKey("tomato", "potato")]:
    "Same nightshade family — they share and spread early and late blight.",
  [pairKey("eggplant", "potato")]:
    "Same nightshade family — Colorado potato beetles happily eat both.",
  [pairKey("beet", "green-bean")]:
    "Beans and beets stunt each other's growth when planted close.",
  [pairKey("green-bean", "swiss-chard")]:
    "Chard is a beet cousin — the same bean-beet antagonism applies.",
  [pairKey("green-bean", "onion")]:
    "Alliums exude compounds that stunt beans' nitrogen-fixing roots.",
  [pairKey("green-bean", "garlic")]:
    "Alliums exude compounds that stunt beans' nitrogen-fixing roots.",
  [pairKey("pea", "onion")]:
    "Alliums exude compounds that stunt peas' nitrogen-fixing roots.",
  [pairKey("pea", "garlic")]:
    "Alliums exude compounds that stunt peas' nitrogen-fixing roots.",
  [pairKey("tepary-bean", "onion")]:
    "Alliums exude compounds that stunt beans' nitrogen-fixing roots.",
  [pairKey("tepary-bean", "garlic")]:
    "Alliums exude compounds that stunt beans' nitrogen-fixing roots.",
  [pairKey("cucumber", "potato")]:
    "They compete for water, and cucumbers can encourage potato blight.",
  [pairKey("zucchini", "potato")]:
    "Sprawling squash vines and hilled potatoes fight for ground and moisture.",
  [pairKey("winter-squash", "potato")]:
    "Sprawling squash vines and hilled potatoes fight for ground and moisture.",
  [pairKey("melon", "potato")]:
    "Sprawling melon vines and hilled potatoes fight for ground and moisture.",
  [pairKey("cucumber", "sage")]:
    "Strongly aromatic sage is known to stunt cucumber vines.",
  [pairKey("sunflower", "potato")]:
    "Sunflowers are allelopathic — roots and seed hulls release growth inhibitors.",
  [pairKey("sunflower", "green-bean")]:
    "Sunflowers are allelopathic — roots and seed hulls release growth inhibitors.",

  // --- friends: the classics ----------------------------------------------
  [pairKey("tomato", "basil")]:
    "Basil's scent confuses hornworm moths — and many swear it sweetens the fruit.",
  [pairKey("tomato", "garlic")]:
    "Garlic's sulfur compounds help deter spider mites and blight spores.",
  [pairKey("carrot", "onion")]:
    "Onion scent masks carrots from the carrot root fly, and vice versa.",
  [pairKey("carrot", "tomato")]:
    "Tomatoes give carrots light shade; loose carrot rows aerate tomato roots.",
  [pairKey("sweet-corn", "green-bean")]:
    "Beans fix nitrogen for hungry corn; corn is the beans' living trellis (Three Sisters).",
  [pairKey("sweet-corn", "winter-squash")]:
    "Squash leaves mulch corn's roots and deter raiders (Three Sisters).",
  [pairKey("green-bean", "winter-squash")]:
    "Beans feed the soil that the big squash vines draw from (Three Sisters).",
  [pairKey("sweet-corn", "tepary-bean")]:
    "The desert Three Sisters — tepary beans fix nitrogen and climb the stalks.",
  [pairKey("lettuce", "radish")]:
    "Radishes break the soil crust and are harvested before lettuce needs the room.",
  [pairKey("cucumber", "radish")]:
    "Radishes lure cucumber beetles away from the vines.",
  [pairKey("spinach", "pea")]:
    "Peas fix nitrogen that leafy spinach loves; spinach shades their roots.",
  [pairKey("bell-pepper", "basil")]:
    "Basil helps repel the aphids and thrips that bother peppers.",
  [pairKey("broccoli", "sage")]:
    "Aromatic sage masks brassicas from cabbage moths.",
  [pairKey("broccoli", "thyme")]:
    "Thyme deters cabbage worms hunting for brassicas.",
  [pairKey("rosemary", "sage")]:
    "Mediterranean pair with matching lean-soil, low-water habits.",
  [pairKey("rosemary", "lavender")]:
    "Mediterranean pair with matching lean-soil, low-water habits.",
};

/**
 * The one-line reason two plants clash or pair well, or null when the dataset
 * doesn't record one. Order-independent.
 */
export function pairNote(a: string, b: string): string | null {
  return PAIR_NOTES[pairKey(a, b)] ?? null;
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
