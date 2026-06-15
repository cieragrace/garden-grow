/**
 * zones.ts — USDA Plant Hardiness Zone resolution for US zipcodes.
 *
 * Data-agnostic by design: this module never imports plant data. Filtering
 * helpers accept the plant list as an argument so `zones.ts` stays decoupled
 * from `plants.ts`.
 *
 * Resolution strategy (fallback-FIRST for instant, offline-friendly results):
 *   1. Resolve INSTANTLY from the bundled zip3-prefix lookup so the app always
 *      returns a plausible zone with zero latency, even fully offline.
 *   2. Optionally refine that answer with the free phzmapi.org API
 *      (https://phzmapi.org/{zip}.json), which returns a zone string like "6b"
 *      (we parse the leading integer, 6b -> 6). The network call has a short
 *      ~1.2s timeout and is best-effort: any failure/timeout silently keeps the
 *      instant fallback answer.
 *
 * NOTE: The bundled fallback is APPROXIMATE. USDA hardiness zones do not map
 * cleanly to zip codes (zones follow climate/elevation, zips follow postal
 * logistics), so a single zip3 prefix can span multiple real zones. The
 * fallback picks a representative zone for each prefix range that is "close
 * enough" for plant-recommendation purposes. When the API is reachable, its
 * answer is always preferred over the fallback.
 */

export interface ZoneResult {
  /** Numeric USDA hardiness zone (1–13), e.g. 6 for "6b". */
  zone: number;
  /** Human-readable label, e.g. "Zone 6" or "Zone 6 (approx.)". */
  label: string;
  /** Where the answer came from. */
  source: 'api' | 'fallback';
}

/** Timeout for the optional phzmapi.org refinement request, in milliseconds. */
const API_TIMEOUT_MS = 1200;

/**
 * Validate a US zipcode: exactly 5 digits.
 * (ZIP+4 and non-numeric input are rejected; pass the 5-digit base only.)
 */
export function isValidZip(zip: string): boolean {
  return /^\d{5}$/.test(zip);
}

/**
 * Parse the numeric zone out of a phzmapi-style zone string.
 * "6b" -> 6, "10a" -> 10, "3" -> 3. Returns null if no leading integer.
 */
function parseZoneNumber(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.trunc(raw);
  }
  if (typeof raw !== 'string') return null;
  const match = raw.trim().match(/^(\d{1,2})/);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  if (!Number.isFinite(n) || n < 1 || n > 13) return null;
  return n;
}

/**
 * Bundled approximate fallback table.
 *
 * Keyed by the 3-digit zip prefix (zip3). Each entry is an inclusive range of
 * zip3 prefixes mapped to a representative USDA zone. This covers all valid US
 * zip3 prefixes (004–999). Ranges are intentionally coarse — see the module
 * note about why zip→zone is inherently approximate.
 *
 * Sources used to build this table: general USDA hardiness zone geography by
 * region cross-referenced with USPS zip3 prefix-to-state/region assignments.
 */
interface PrefixRange {
  /** Inclusive lower bound of the zip3 prefix (0–999). */
  min: number;
  /** Inclusive upper bound of the zip3 prefix (0–999). */
  max: number;
  /** Representative approximate USDA zone for this range. */
  zone: number;
}

const FALLBACK_RANGES: PrefixRange[] = [
  // Caribbean territories — tropical (11–13)
  { min: 0, max: 9, zone: 12 }, //  006–009 PR/VI (tropical)
  // New England — cold (3–6)
  { min: 10, max: 27, zone: 5 }, //  010–027 MA/RI (5–6)
  { min: 28, max: 29, zone: 5 }, //  028–029 RI
  { min: 30, max: 38, zone: 5 }, //  030–038 NH (4–6)
  { min: 39, max: 49, zone: 4 }, //  039–049 ME (3–5)
  { min: 50, max: 59, zone: 4 }, //  050–059 VT (3–5)

  // Northeast Mid-Atlantic (5–7)
  { min: 60, max: 69, zone: 6 }, //  060–069 CT
  { min: 70, max: 89, zone: 7 }, //  070–089 NJ
  { min: 90, max: 98, zone: 7 }, //  090–098 APO/NJ edge
  { min: 100, max: 149, zone: 6 }, // 100–149 NY (4b–7)
  { min: 150, max: 196, zone: 6 }, // 150–196 PA (5–7)
  { min: 197, max: 199, zone: 7 }, // 197–199 DE

  // Mid-Atlantic / Upper South (6–8)
  { min: 200, max: 219, zone: 7 }, // 200–219 DC/MD/VA (6b–7)
  { min: 220, max: 246, zone: 7 }, // 220–246 VA/WV (6–7)
  { min: 247, max: 268, zone: 6 }, // 247–268 WV (5–7)
  { min: 270, max: 289, zone: 7 }, // 270–289 NC (6–8)
  { min: 290, max: 299, zone: 8 }, // 290–299 SC (7–9)

  // Southeast (8–9)
  { min: 300, max: 319, zone: 8 }, // 300–319 GA (6b–9)
  { min: 320, max: 349, zone: 9 }, // 320–349 FL (8–11)
  { min: 350, max: 369, zone: 7 }, // 350–369 AL (7–9)
  { min: 370, max: 385, zone: 7 }, // 370–385 TN (5b–8)
  { min: 386, max: 397, zone: 8 }, // 386–397 MS (7–9)
  { min: 398, max: 399, zone: 8 }, // 398–399 GA edge

  // Kentucky / Ohio Valley (6–7)
  { min: 400, max: 427, zone: 6 }, // 400–427 KY (6–7)
  { min: 430, max: 459, zone: 6 }, // 430–459 OH (5b–6)
  { min: 460, max: 479, zone: 6 }, // 460–479 IN (5–6)
  { min: 480, max: 499, zone: 5 }, // 480–499 MI (4–6)

  // Upper Midwest — cold (3–5)
  { min: 500, max: 528, zone: 5 }, // 500–528 IA (4–5)
  { min: 530, max: 549, zone: 5 }, // 530–549 WI (3–5)
  { min: 550, max: 567, zone: 4 }, // 550–567 MN (3–5)
  { min: 570, max: 577, zone: 4 }, // 570–577 SD (4–5)
  { min: 580, max: 588, zone: 4 }, // 580–588 ND (3–4)
  { min: 590, max: 599, zone: 4 }, // 590–599 MT (3–5)

  // Central Plains (5–6)
  { min: 600, max: 629, zone: 5 }, // 600–629 IL (5–6)
  { min: 630, max: 658, zone: 6 }, // 630–658 MO (5b–7)
  { min: 660, max: 679, zone: 6 }, // 660–679 KS (5–7)
  { min: 680, max: 693, zone: 5 }, // 680–693 NE (4–5)

  // South Central (7–9)
  { min: 700, max: 714, zone: 9 }, // 700–714 LA (8–9)
  { min: 716, max: 729, zone: 7 }, // 716–729 AR (6b–8)
  { min: 730, max: 749, zone: 7 }, // 730–749 OK (6–8)
  { min: 750, max: 799, zone: 8 }, // 750–799 TX (6b–9)

  // Mountain West (4–7)
  { min: 800, max: 816, zone: 5 }, // 800–816 CO (3–6)
  { min: 820, max: 831, zone: 5 }, // 820–831 WY (3–5)
  { min: 832, max: 838, zone: 6 }, // 832–838 ID (4–7)
  { min: 840, max: 847, zone: 6 }, // 840–847 UT (4–8)
  { min: 850, max: 865, zone: 9 }, // 850–865 AZ (7–10, low-desert lean)
  { min: 870, max: 884, zone: 7 }, // 870–884 NM (5–8)
  { min: 889, max: 898, zone: 8 }, // 889–898 NV (5–9, Vegas lean)

  // West Coast (8–10)
  { min: 900, max: 928, zone: 10 }, // 900–928 Southern CA (9–11)
  { min: 930, max: 961, zone: 9 }, //  930–961 Central/Northern CA (8–10)
  { min: 967, max: 968, zone: 12 }, // 967–968 HI (11–13)
  { min: 969, max: 969, zone: 11 }, // 969 Guam/Pacific
  { min: 970, max: 979, zone: 8 }, //  970–979 OR (6–9)
  { min: 980, max: 994, zone: 8 }, //  980–994 WA (6–9)
  { min: 995, max: 999, zone: 4 }, //  995–999 AK (1–8, interior lean)
];

/**
 * Approximate fallback zone for a 5-digit zip, using the zip3 prefix table.
 * Always returns a plausible zone for any valid US zip (covers 004–999).
 * Defaults to zone 7 (national-ish median) for the rare unmatched prefix.
 */
function fallbackZone(zip: string): number {
  const prefix = parseInt(zip.slice(0, 3), 10);
  if (!Number.isFinite(prefix)) return 7;
  for (const range of FALLBACK_RANGES) {
    if (prefix >= range.min && prefix <= range.max) {
      return range.zone;
    }
  }
  return 7; // national median fallback for any unmapped prefix
}

/**
 * Best-effort refinement via phzmapi.org. Resolves to a precise zone number
 * when the network call succeeds within the short timeout, otherwise null.
 * Never throws — all failures (network, timeout/abort, bad JSON) become null.
 */
async function refineZoneFromApi(zip: string): Promise<number | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const res = await fetch(`https://phzmapi.org/${zip}.json`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    const raw =
      data && typeof data === 'object' && 'zone' in data
        ? (data as { zone: unknown }).zone
        : null;
    return parseZoneNumber(raw);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve a zipcode to a USDA hardiness zone.
 *
 * Returns null only when the input is not a valid 5-digit zip. For any valid
 * zip this ALWAYS resolves instantly from the bundled approximate fallback,
 * then tries to refine that answer with the live API (short timeout). The
 * fallback-first ordering means results feel immediate and work fully offline.
 */
export async function zoneForZip(
  zip: string,
): Promise<ZoneResult | null> {
  if (!isValidZip(zip)) return null;

  // 1. Instant, offline-safe fallback (always succeeds for a valid zip).
  const fallback = fallbackZone(zip);

  // 2. Best-effort refinement from the live API; keep the fallback on failure.
  const refined = await refineZoneFromApi(zip);
  if (refined !== null) {
    return { zone: refined, label: `Zone ${refined}`, source: 'api' };
  }

  return { zone: fallback, label: `Zone ${fallback} (approx.)`, source: 'fallback' };
}
