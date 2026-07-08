/**
 * Curated vegetable & herb dataset for a "what can I grow in my zone" app.
 *
 * Pure data + helpers only — no React, no side effects.
 *
 * USDA hardiness zones are referenced here as a rough proxy for "how warm /
 * long is your growing season". For an annual-vegetable app this is a deliberate
 * simplification: we use the zone number to shift planting windows earlier in
 * warmer regions and later in colder ones (see `plantingWindows`).
 */

export type PlantCategory =
  | "Vegetable"
  | "Herb"
  | "Leafy Green"
  | "Root"
  | "Legume";

/**
 * Companion-planting relationships for a plant.
 *
 * `friends` and `foes` are arrays of OTHER plant ids in this same dataset.
 * Relationships are kept symmetric: if A lists B as a foe, B lists A as a foe
 * (and likewise for friends). See `companionReport` in `lib/companions.ts`.
 */
export interface Companions {
  /** Plant ids that grow well alongside this one. */
  friends: string[];
  /** Plant ids that should NOT be planted near this one. */
  foes: string[];
}

export interface Plant {
  /** kebab-case slug, unique across the dataset */
  id: string;
  /** Display name */
  name: string;
  /** A fitting emoji icon for quick visual scanning */
  emoji: string;
  category: PlantCategory;
  /** 1–2 friendly sentences for the plant detail card */
  description: string;
  /** Light requirement, e.g. 'Full sun' */
  sun: string;
  /** Water requirement, e.g. '1-2 inches / week' */
  water: string;
  /** Spacing between rows */
  rowSpacing: string;
  /** Spacing between seeds/plants within a row */
  seedSpacing: string;
  /** How deep to sow seeds / set transplants, e.g. 'Seeds ¼ in deep'. */
  plantingDepth: string;
  /** Expected mature footprint, e.g. '4–6 ft tall, staked'. */
  matureSize: string;
  /** Days from sow/transplant to harvest, e.g. '60-80 days' */
  growingDuration: string;
  /** USDA hardiness zones (3–10) where this is commonly grown */
  zones: number[];
  /**
   * Whether this crop is typically started indoors before transplanting.
   * Direct-sow crops (carrots, beans, radishes, etc.) are `false` and will
   * return `null` indoor windows from `plantingWindows`.
   */
  startsIndoors: boolean;
  /**
   * Marks drought-tough / low-water edibles (the "water-wise" collection).
   * Omitted (falsy) for crops with ordinary water needs.
   */
  waterWise?: boolean;
  /** Companion-planting friends & foes (ids of other plants in this dataset). */
  companions: Companions;
}

/** Month abbreviations, indexed 0 (Jan) → 11 (Dec). */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type MonthName = (typeof MONTHS)[number];

export const plants: Plant[] = [
  {
    id: "tomato",
    name: "Tomato",
    emoji: "🍅",
    category: "Vegetable",
    description:
      "The crown jewel of the summer garden. Warm-loving and worth the wait — vine-ripened beats store-bought every time.",
    sun: "Full sun",
    water: "1-2 inches / week",
    rowSpacing: "36-48 in",
    seedSpacing: "18-24 in",
    plantingDepth: "Seeds ¼ in deep; transplant deep, burying the stem to the first true leaves",
    matureSize: "4–6 ft tall, staked or caged",
    growingDuration: "60-85 days",
    zones: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    startsIndoors: true,
    companions: {
      friends: ["basil", "carrot", "parsley", "onion", "garlic"],
      foes: ["sweet-corn", "broccoli", "cauliflower", "kale", "potato"],
    },
  },
  {
    id: "bell-pepper",
    name: "Bell Pepper",
    emoji: "🫑",
    category: "Vegetable",
    description:
      "Sweet, crunchy, and happiest in heat. Peppers are slow starters, so give them a long head start indoors.",
    sun: "Full sun",
    water: "1-2 inches / week",
    rowSpacing: "24-36 in",
    seedSpacing: "18 in",
    plantingDepth: "Seeds ¼ in deep; set transplants at the same depth as the pot",
    matureSize: "24–30 in tall, 18 in wide",
    growingDuration: "60-90 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    startsIndoors: true,
    companions: {
      friends: ["basil", "onion", "carrot", "okra", "oregano"],
      foes: [],
    },
  },
  {
    id: "carrot",
    name: "Carrot",
    emoji: "🥕",
    category: "Root",
    description:
      "Sweetest when grown in loose, stone-free soil. Direct-sow only — carrots resent being transplanted.",
    sun: "Full sun",
    water: "1 inch / week",
    rowSpacing: "12-18 in",
    seedSpacing: "2-3 in",
    plantingDepth: "Seeds ¼–½ in deep; direct-sow only (do not transplant)",
    matureSize: "10–12 in tall tops; roots 6–8 in long",
    growingDuration: "60-80 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10],
    startsIndoors: false,
    companions: {
      friends: ["tomato", "onion", "pea", "lettuce", "radish", "bell-pepper", "sage"],
      foes: [],
    },
  },
  {
    id: "beet",
    name: "Beet",
    emoji: "🫜",
    category: "Root",
    description:
      "A two-for-one crop: earthy roots plus tender, edible greens. Cool weather keeps them tender and sweet.",
    sun: "Full sun",
    water: "1 inch / week",
    rowSpacing: "12-18 in",
    seedSpacing: "3-4 in",
    plantingDepth: "Seeds ½ in deep; direct-sow",
    matureSize: "8–12 in tall tops; roots 2–3 in across",
    growingDuration: "50-70 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10],
    startsIndoors: false,
    companions: {
      friends: ["onion", "garlic", "lettuce", "broccoli", "cauliflower", "kale"],
      foes: ["green-bean"],
    },
  },
  {
    id: "lettuce",
    name: "Lettuce",
    emoji: "🥬",
    category: "Leafy Green",
    description:
      "Fast, forgiving, and endlessly cut-and-come-again. Grows best in the cool shoulders of spring and fall.",
    sun: "Full sun to part shade",
    water: "1-2 inches / week",
    rowSpacing: "12-18 in",
    seedSpacing: "6-8 in",
    plantingDepth: "Seeds ¼ in deep; set transplants at soil-line depth",
    matureSize: "6–12 in tall, 8–10 in wide",
    growingDuration: "30-60 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10],
    startsIndoors: true,
    companions: {
      friends: ["carrot", "radish", "cucumber", "beet", "onion", "spinach"],
      foes: [],
    },
  },
  {
    id: "kale",
    name: "Kale",
    emoji: "🥬",
    category: "Leafy Green",
    description:
      "Tough, nutritious, and improbably hardy — a frost actually makes the leaves sweeter. Harvest all season long.",
    sun: "Full sun to part shade",
    water: "1-1.5 inches / week",
    rowSpacing: "18-24 in",
    seedSpacing: "12-18 in",
    plantingDepth: "Seeds ¼–½ in deep; set transplants at soil-line depth",
    matureSize: "18–24 in tall, 18 in wide",
    growingDuration: "50-70 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10],
    startsIndoors: true,
    companions: {
      friends: ["beet", "onion", "garlic"],
      foes: ["tomato"],
    },
  },
  {
    id: "spinach",
    name: "Spinach",
    emoji: "🍃",
    category: "Leafy Green",
    description:
      "A cold-season speedster that bolts the moment summer heat arrives. Sow early and again in fall.",
    sun: "Full sun to part shade",
    water: "1-1.5 inches / week",
    rowSpacing: "12-14 in",
    seedSpacing: "3-4 in",
    plantingDepth: "Seeds ½ in deep; direct-sow",
    matureSize: "6–10 in tall, 6 in wide",
    growingDuration: "35-50 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    startsIndoors: false,
    companions: {
      friends: ["pea", "radish", "cauliflower", "cilantro", "lettuce"],
      foes: [],
    },
  },
  {
    id: "cucumber",
    name: "Cucumber",
    emoji: "🥒",
    category: "Vegetable",
    description:
      "Vigorous, thirsty vines that reward you with crisp fruit by the armful. Trellis them to save space.",
    sun: "Full sun",
    water: "1-2 inches / week",
    rowSpacing: "36-60 in",
    seedSpacing: "12 in",
    plantingDepth: "Seeds 1 in deep; direct-sow",
    matureSize: "6–8 ft vines, trellised; 18 in wide if left to sprawl",
    growingDuration: "50-70 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    startsIndoors: false,
    companions: {
      friends: ["lettuce", "pea", "radish", "green-bean", "sweet-corn", "sunflower"],
      foes: ["potato", "sage"],
    },
  },
  {
    id: "zucchini",
    name: "Zucchini",
    emoji: "🥒",
    category: "Vegetable",
    description:
      "Famously, almost comically productive. Plant just one or two and you'll be sharing with the whole neighborhood.",
    sun: "Full sun",
    water: "1-2 inches / week",
    rowSpacing: "36-48 in",
    seedSpacing: "24-36 in",
    plantingDepth: "Seeds 1 in deep; direct-sow",
    matureSize: "24–36 in tall, 3–4 ft wide bush",
    growingDuration: "45-60 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10],
    startsIndoors: false,
    companions: {
      friends: ["sweet-corn", "green-bean"],
      foes: ["potato"],
    },
  },
  {
    id: "winter-squash",
    name: "Winter Squash",
    emoji: "🎃",
    category: "Vegetable",
    description:
      "Sprawling vines that trade space for storage — these hard-skinned squash keep for months in a cool pantry.",
    sun: "Full sun",
    water: "1-2 inches / week",
    rowSpacing: "48-72 in",
    seedSpacing: "24-36 in",
    plantingDepth: "Seeds 1 in deep; direct-sow",
    matureSize: "12–18 in tall, 6–12 ft sprawling vines",
    growingDuration: "85-120 days",
    zones: [4, 5, 6, 7, 8, 9, 10],
    startsIndoors: false,
    companions: {
      friends: ["sweet-corn", "green-bean", "tepary-bean"],
      foes: ["potato"],
    },
  },
  {
    id: "green-bean",
    name: "Green Bean",
    emoji: "🫛",
    category: "Legume",
    description:
      "An easy win for new gardeners. Bush types need no support; pole types climb high and crop for weeks.",
    sun: "Full sun",
    water: "1-1.5 inches / week",
    rowSpacing: "18-24 in",
    seedSpacing: "4-6 in",
    plantingDepth: "Seeds 1–1½ in deep; direct-sow",
    matureSize: "Bush 18–24 in tall; pole types 6–8 ft on a trellis",
    growingDuration: "50-65 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10],
    startsIndoors: false,
    companions: {
      friends: ["sweet-corn", "winter-squash", "zucchini", "cucumber", "pea", "eggplant", "potato"],
      foes: ["onion", "garlic", "beet", "swiss-chard", "sunflower"],
    },
  },
  {
    id: "pea",
    name: "Pea",
    emoji: "🫛",
    category: "Legume",
    description:
      "One of the first things you can plant in spring. Sweetest eaten straight off the vine, still warm from the sun.",
    sun: "Full sun to part shade",
    water: "1 inch / week",
    rowSpacing: "18-24 in",
    seedSpacing: "1-2 in",
    plantingDepth: "Seeds 1 in deep; direct-sow",
    matureSize: "Bush 24 in tall; vining types 5–6 ft on a trellis",
    growingDuration: "55-70 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    startsIndoors: false,
    companions: {
      friends: ["carrot", "cucumber", "radish", "green-bean", "spinach", "eggplant"],
      foes: ["onion", "garlic"],
    },
  },
  {
    id: "radish",
    name: "Radish",
    emoji: "🫜",
    category: "Root",
    description:
      "The instant gratification crop — some varieties are ready in three to four weeks. Great for tucking between slower plants.",
    sun: "Full sun to part shade",
    water: "1 inch / week",
    rowSpacing: "6-12 in",
    seedSpacing: "1-2 in",
    plantingDepth: "Seeds ½ in deep; direct-sow",
    matureSize: "6–8 in tall tops; roots 1 in across",
    growingDuration: "22-35 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10],
    startsIndoors: false,
    companions: {
      friends: ["carrot", "lettuce", "cucumber", "pea", "spinach", "melon"],
      foes: [],
    },
  },
  {
    id: "broccoli",
    name: "Broccoli",
    emoji: "🥦",
    category: "Vegetable",
    description:
      "A cool-season favorite that rewards patience with big central heads plus weeks of side shoots.",
    sun: "Full sun",
    water: "1-1.5 inches / week",
    rowSpacing: "24-36 in",
    seedSpacing: "18 in",
    plantingDepth: "Seeds ¼–½ in deep; set transplants at soil-line depth",
    matureSize: "18–30 in tall, 24 in wide",
    growingDuration: "60-85 days",
    zones: [3, 4, 5, 6, 7, 8, 9],
    startsIndoors: true,
    companions: {
      friends: ["beet", "onion", "garlic", "sage", "thyme"],
      foes: ["tomato"],
    },
  },
  {
    id: "cauliflower",
    name: "Cauliflower",
    emoji: "🥦",
    category: "Vegetable",
    description:
      "The diva of the brassica family — it wants steady cool weather and even moisture, but rewards you with tidy white heads.",
    sun: "Full sun",
    water: "1.5-2 inches / week",
    rowSpacing: "24-36 in",
    seedSpacing: "18-24 in",
    plantingDepth: "Seeds ¼–½ in deep; set transplants at soil-line depth",
    matureSize: "18–24 in tall, 24–30 in wide",
    growingDuration: "70-90 days",
    zones: [3, 4, 5, 6, 7, 8, 9],
    startsIndoors: true,
    companions: {
      friends: ["beet", "onion", "garlic", "spinach"],
      foes: ["tomato"],
    },
  },
  {
    id: "onion",
    name: "Onion",
    emoji: "🧅",
    category: "Vegetable",
    description:
      "A kitchen staple that stores for months. Day length matters — pick long-day types up north, short-day down south.",
    sun: "Full sun",
    water: "1 inch / week",
    rowSpacing: "12-18 in",
    seedSpacing: "3-4 in",
    plantingDepth: "Seeds ¼ in deep; sets/transplants 1 in deep",
    matureSize: "12–18 in tall, 4–6 in wide",
    growingDuration: "90-120 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10],
    startsIndoors: true,
    companions: {
      friends: ["tomato", "carrot", "beet", "lettuce", "broccoli", "cauliflower", "kale", "bell-pepper", "swiss-chard"],
      foes: ["green-bean", "pea", "tepary-bean"],
    },
  },
  {
    id: "garlic",
    name: "Garlic",
    emoji: "🧄",
    category: "Vegetable",
    description:
      "Planted in fall, harvested next summer — the ultimate patient gardener's crop. Plant cloves pointy-side up.",
    sun: "Full sun",
    water: "0.5-1 inch / week",
    rowSpacing: "12 in",
    seedSpacing: "4-6 in",
    plantingDepth: "Cloves 2 in deep, pointy-side up; direct-plant in fall",
    matureSize: "12–24 in tall, 6–10 in wide (foliage fan)",
    growingDuration: "240-270 days",
    zones: [3, 4, 5, 6, 7, 8, 9],
    startsIndoors: false,
    companions: {
      friends: ["tomato", "beet", "broccoli", "cauliflower", "kale"],
      foes: ["green-bean", "pea", "tepary-bean"],
    },
  },
  {
    id: "basil",
    name: "Basil",
    emoji: "🌿",
    category: "Herb",
    description:
      "Summer in leaf form. Loves heat, hates cold, and gets bushier every time you pinch it back for the kitchen.",
    sun: "Full sun",
    water: "1 inch / week",
    rowSpacing: "12-18 in",
    seedSpacing: "8-12 in",
    plantingDepth: "Seeds ¼ in deep; set transplants at soil-line depth",
    matureSize: "18–24 in tall, 12–18 in wide",
    growingDuration: "50-75 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    startsIndoors: true,
    companions: {
      friends: ["tomato", "bell-pepper", "eggplant"],
      foes: [],
    },
  },
  {
    id: "cilantro",
    name: "Cilantro",
    emoji: "🌿",
    category: "Herb",
    description:
      "A cool-weather herb that bolts fast in heat — but then gifts you coriander seed. Sow little and often.",
    sun: "Full sun to part shade",
    water: "1 inch / week",
    rowSpacing: "12 in",
    seedSpacing: "4-6 in",
    plantingDepth: "Seeds ¼–½ in deep; direct-sow (resents transplanting)",
    matureSize: "6–12 in tall at leafy stage; 18–24 in tall only when bolting to seed",
    growingDuration: "40-55 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10],
    startsIndoors: false,
    companions: {
      friends: ["spinach"],
      foes: [],
    },
  },
  {
    id: "sweet-corn",
    name: "Sweet Corn",
    emoji: "🌽",
    category: "Vegetable",
    description:
      "Nothing beats sweet corn picked minutes before dinner. Plant in blocks rather than rows for good pollination.",
    sun: "Full sun",
    water: "1-1.5 inches / week",
    rowSpacing: "30-36 in",
    seedSpacing: "8-12 in",
    plantingDepth: "Seeds 1–1½ in deep; direct-sow in blocks for pollination",
    matureSize: "5–8 ft tall, 12–18 in wide",
    growingDuration: "60-100 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    startsIndoors: false,
    companions: {
      friends: ["green-bean", "winter-squash", "zucchini", "cucumber", "potato", "tepary-bean", "amaranth", "melon"],
      foes: ["tomato"],
    },
  },
  {
    id: "swiss-chard",
    name: "Swiss Chard",
    emoji: "🥬",
    category: "Leafy Green",
    description:
      "Beautiful neon stems and a long, generous harvest. More heat-tolerant than spinach, so it carries you through summer.",
    sun: "Full sun to part shade",
    water: "1-1.5 inches / week",
    rowSpacing: "18 in",
    seedSpacing: "6-12 in",
    plantingDepth: "Seeds ½ in deep; direct-sow",
    matureSize: "18–24 in tall, 12 in wide",
    growingDuration: "50-65 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10],
    startsIndoors: false,
    companions: {
      friends: ["onion"],
      foes: ["green-bean"],
    },
  },
  {
    id: "eggplant",
    name: "Eggplant",
    emoji: "🍆",
    category: "Vegetable",
    description:
      "A heat-lover that thrives where peppers and tomatoes do. Glossy fruit are best picked young and tender.",
    sun: "Full sun",
    water: "1-1.5 inches / week",
    rowSpacing: "30-36 in",
    seedSpacing: "18-24 in",
    plantingDepth: "Seeds ¼ in deep; set transplants slightly deeper than the pot",
    matureSize: "24–36 in tall, 24 in wide",
    growingDuration: "70-90 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    startsIndoors: true,
    companions: {
      friends: ["green-bean", "basil", "pea", "okra"],
      foes: ["potato"],
    },
  },
  {
    id: "potato",
    name: "Potato",
    emoji: "🥔",
    category: "Root",
    description:
      "Grow them once and you'll be hooked — digging potatoes feels like treasure hunting. Plant seed potatoes, not store-bought.",
    sun: "Full sun",
    water: "1-2 inches / week",
    rowSpacing: "30-36 in",
    seedSpacing: "12 in",
    plantingDepth: "Seed potatoes 4 in deep, eyes up; hill soil as plants grow",
    matureSize: "18–24 in tall, 18–24 in wide",
    growingDuration: "70-120 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10],
    startsIndoors: false,
    companions: {
      friends: ["green-bean", "sweet-corn"],
      foes: ["tomato", "cucumber", "zucchini", "winter-squash", "eggplant", "sunflower", "melon"],
    },
  },
  {
    id: "parsley",
    name: "Parsley",
    emoji: "🌿",
    category: "Herb",
    description:
      "An unfussy, frost-hardy herb that earns its place in every garden bed. Slow to germinate, so be patient with the seeds.",
    sun: "Full sun to part shade",
    water: "1 inch / week",
    rowSpacing: "12 in",
    seedSpacing: "6-8 in",
    plantingDepth: "Seeds ¼ in deep; soak overnight to speed slow germination",
    matureSize: "12–18 in tall, 9–12 in wide",
    growingDuration: "70-90 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    startsIndoors: true,
    companions: {
      friends: ["tomato"],
      foes: [],
    },
  },

  // --- Water-wise / drought-tough edibles -------------------------------
  {
    id: "okra",
    name: "Okra",
    emoji: "🌶️",
    category: "Vegetable",
    description:
      "A heat-and-drought champion that hits its stride when other crops wilt. Pick pods young and it keeps producing all summer.",
    sun: "Full sun",
    water: "0.5-1 inch / week",
    rowSpacing: "36 in",
    seedSpacing: "12-18 in",
    plantingDepth: "Seeds ½–1 in deep; soak overnight, direct-sow after soil warms",
    matureSize: "3–6 ft tall, 24 in wide",
    growingDuration: "50-65 days",
    zones: [5, 6, 7, 8, 9, 10, 11],
    startsIndoors: false,
    waterWise: true,
    companions: {
      friends: ["bell-pepper", "eggplant", "sweet-potato"],
      foes: [],
    },
  },
  {
    id: "tepary-bean",
    name: "Tepary Bean",
    emoji: "🫘",
    category: "Legume",
    description:
      "A desert heirloom grown in the Southwest for centuries — arguably the most drought-tolerant bean on earth. Water deeply, then leave it alone.",
    sun: "Full sun",
    water: "0.5 inch / week once established",
    rowSpacing: "18-24 in",
    seedSpacing: "4-6 in",
    plantingDepth: "Seeds 1 in deep; direct-sow in warm soil",
    matureSize: "Low bush or short vines, 18–24 in",
    growingDuration: "60-90 days",
    zones: [5, 6, 7, 8, 9, 10, 11],
    startsIndoors: false,
    waterWise: true,
    companions: {
      friends: ["sweet-corn", "winter-squash"],
      foes: ["onion", "garlic"],
    },
  },
  {
    id: "amaranth",
    name: "Amaranth",
    emoji: "🌾",
    category: "Leafy Green",
    description:
      "A two-for-one heat lover: tender leaves for the pan now, showy seed heads full of grain later. Thrives on neglect once it's up.",
    sun: "Full sun",
    water: "0.5-1 inch / week",
    rowSpacing: "18-24 in",
    seedSpacing: "6-12 in",
    plantingDepth: "Seeds ⅛ in deep, barely covered; direct-sow after frost",
    matureSize: "2–6 ft tall depending on variety",
    growingDuration: "30-50 days for greens; 90+ for grain",
    zones: [4, 5, 6, 7, 8, 9, 10, 11],
    startsIndoors: false,
    waterWise: true,
    companions: {
      friends: ["sweet-corn"],
      foes: [],
    },
  },
  {
    id: "sunflower",
    name: "Sunflower",
    emoji: "🌻",
    category: "Vegetable",
    description:
      "Snack seeds, pollinator magnet, and living trellis in one tall package. Deep taproots find water most crops can't reach.",
    sun: "Full sun",
    water: "0.5-1 inch / week",
    rowSpacing: "30-36 in",
    seedSpacing: "12-18 in",
    plantingDepth: "Seeds 1 in deep; direct-sow after frost",
    matureSize: "4–10 ft tall depending on variety",
    growingDuration: "70-100 days",
    zones: [3, 4, 5, 6, 7, 8, 9, 10, 11],
    startsIndoors: false,
    waterWise: true,
    companions: {
      friends: ["cucumber"],
      foes: ["potato", "green-bean"],
    },
  },
  {
    id: "melon",
    name: "Melon",
    emoji: "🍈",
    category: "Vegetable",
    description:
      "Cantaloupe and honeydew sweeten best when you ease off the water as fruit ripens — dry heat is their friend. Give the vines room to roam.",
    sun: "Full sun",
    water: "1 inch / week, tapering at ripening",
    rowSpacing: "48-72 in",
    seedSpacing: "24-36 in",
    plantingDepth: "Seeds 1 in deep; transplant carefully without disturbing roots",
    matureSize: "12–18 in tall, 4–8 ft sprawling vines",
    growingDuration: "70-100 days",
    zones: [4, 5, 6, 7, 8, 9, 10, 11],
    startsIndoors: true,
    waterWise: true,
    companions: {
      friends: ["sweet-corn", "radish"],
      foes: ["potato"],
    },
  },
  {
    id: "sweet-potato",
    name: "Sweet Potato",
    emoji: "🍠",
    category: "Root",
    description:
      "Plant slips in warm soil and let the vines smother weeds while tubers fatten below. Loves heat, shrugs off dry spells.",
    sun: "Full sun",
    water: "0.5-1 inch / week once established",
    rowSpacing: "36-48 in",
    seedSpacing: "12-18 in",
    plantingDepth: "Slips (rooted sprouts) set 4 in deep; start slips indoors from a tuber",
    matureSize: "12 in tall, vines sprawling 4–10 ft",
    growingDuration: "90-120 days",
    zones: [5, 6, 7, 8, 9, 10, 11],
    startsIndoors: true,
    waterWise: true,
    companions: {
      friends: ["okra"],
      foes: [],
    },
  },
  {
    id: "rosemary",
    name: "Rosemary",
    emoji: "🌿",
    category: "Herb",
    description:
      "A Mediterranean evergreen that would rather be too dry than too wet. One healthy plant seasons a whole year of roasts.",
    sun: "Full sun",
    water: "0.5 inch / week; let soil dry between",
    rowSpacing: "24-36 in",
    seedSpacing: "24 in",
    plantingDepth: "Seeds ¼ in deep (slow); most gardeners start from a transplant",
    matureSize: "2–4 ft tall shrub, 2–3 ft wide",
    growingDuration: "80-100 days to first cuttings",
    zones: [6, 7, 8, 9, 10, 11],
    startsIndoors: true,
    waterWise: true,
    companions: {
      friends: ["sage", "thyme", "lavender"],
      foes: [],
    },
  },
  {
    id: "sage",
    name: "Sage",
    emoji: "🌿",
    category: "Herb",
    description:
      "Soft gray-green leaves, tough-as-nails roots. A classic brassica bodyguard that asks for almost nothing once settled in.",
    sun: "Full sun",
    water: "0.5 inch / week; drought-tolerant when established",
    rowSpacing: "24 in",
    seedSpacing: "18-24 in",
    plantingDepth: "Seeds ¼ in deep; set transplants at soil-line depth",
    matureSize: "18–30 in tall, 24 in wide",
    growingDuration: "75-90 days",
    zones: [4, 5, 6, 7, 8, 9, 10],
    startsIndoors: true,
    waterWise: true,
    companions: {
      friends: ["rosemary", "thyme", "carrot", "broccoli"],
      foes: ["cucumber"],
    },
  },
  {
    id: "thyme",
    name: "Thyme",
    emoji: "🌿",
    category: "Herb",
    description:
      "A low, fragrant carpet that thrives in poor, dry soil where fussier herbs sulk. Shear it back and it just gets thicker.",
    sun: "Full sun",
    water: "0.5 inch / week; let soil dry between",
    rowSpacing: "12-18 in",
    seedSpacing: "8-12 in",
    plantingDepth: "Seeds barely covered, ¼ in; germination is slow — transplants are easier",
    matureSize: "6–12 in tall, 12–18 in spreading",
    growingDuration: "80-95 days",
    zones: [5, 6, 7, 8, 9, 10],
    startsIndoors: true,
    waterWise: true,
    companions: {
      friends: ["rosemary", "sage", "broccoli"],
      foes: [],
    },
  },
  {
    id: "oregano",
    name: "Oregano",
    emoji: "🌿",
    category: "Herb",
    description:
      "The pizza herb is happiest lean and dry — rich soil and heavy watering actually dull its flavor. A patch keeps giving for years.",
    sun: "Full sun",
    water: "0.5 inch / week; let soil dry between",
    rowSpacing: "18 in",
    seedSpacing: "8-12 in",
    plantingDepth: "Seeds surface-sown, pressed in; or set transplants at soil-line depth",
    matureSize: "12–24 in tall, 18 in spreading",
    growingDuration: "80-90 days",
    zones: [4, 5, 6, 7, 8, 9, 10],
    startsIndoors: true,
    waterWise: true,
    companions: {
      friends: ["bell-pepper"],
      foes: [],
    },
  },
  {
    id: "lavender",
    name: "Lavender",
    emoji: "🪻",
    category: "Herb",
    description:
      "Perfume for the garden and the pantry, built for gravelly soil and stingy watering. Overwatering is the only way to fail.",
    sun: "Full sun",
    water: "0.5 inch / week at most once established",
    rowSpacing: "24-36 in",
    seedSpacing: "24 in",
    plantingDepth: "Seeds surface-sown and slow; most gardeners start from a transplant",
    matureSize: "18–30 in tall, 24 in wide",
    growingDuration: "90-110 days to first bloom",
    zones: [5, 6, 7, 8, 9],
    startsIndoors: true,
    waterWise: true,
    companions: {
      friends: ["rosemary"],
      foes: [],
    },
  },
];

/**
 * A planting window pair (start/end months) or `null` when that phase
 * doesn't apply to a given crop (e.g. indoor windows for direct-sow plants).
 */
export interface PlantingWindows {
  /** When to start seeds indoors (null for direct-sow crops). */
  indoorStart: MonthName | null;
  indoorEnd: MonthName | null;
  /** When started seedlings are typically transplanted out (null for direct-sow). */
  seedlingStart: MonthName | null;
  seedlingEnd: MonthName | null;
  /** When to sow/plant directly outdoors. */
  outdoorStart: MonthName | null;
  outdoorEnd: MonthName | null;
}

/**
 * Clamp a month index into the valid 0–11 range and return its name.
 */
function monthName(index: number): MonthName {
  const clamped = Math.max(0, Math.min(11, index));
  return MONTHS[clamped];
}

/**
 * Heuristic for shifting planting windows by zone.
 *
 * We treat zone 6 as the "baseline" temperate reference (roughly a last-frost
 * date in mid-April). Each zone warmer than 6 pushes the season ~3 weeks
 * earlier; each zone colder pushes it ~3 weeks later. We express that as a
 * whole-month offset so the output stays in clean month names:
 *
 *   monthOffset = round((6 - zone) * 0.75)
 *
 *   zone 10 → round(-3.0) = -3 months earlier
 *   zone  9 → round(-2.25) = -2
 *   zone  8 → round(-1.5)  = -2  (rounds away from zero)
 *   zone  7 → round(-0.75) = -1
 *   zone  6 → 0  (baseline)
 *   zone  5 → +1
 *   zone  4 → round(1.5)   = +2
 *   zone  3 → round(2.25)  = +2
 *
 * Negative offset = earlier in the year (warm zone, longer season).
 * Positive offset = later in the year (cold zone, shorter season).
 */
function zoneMonthOffset(zone: number): number {
  return Math.round((6 - zone) * 0.75);
}

/**
 * Baseline (zone-6) planting windows per crop, expressed as month indices.
 * `plantingWindows` shifts these by the zone offset and clamps to Jan–Dec.
 *
 * Each crop falls into one of a few archetypes:
 *  - warm-transplant : start indoors late winter, set out after frost (tomato, pepper…)
 *  - cool-transplant : start indoors late winter, set out early spring (broccoli, lettuce…)
 *  - warm-direct     : direct-sow after the soil warms (beans, corn, squash…)
 *  - cool-direct     : direct-sow early, tolerant of cold (peas, radish, spinach…)
 *  - fall-planted    : planted in autumn for next year (garlic)
 *
 * Indices use the MONTHS array (0 = Jan).
 */
interface BaselineWindow {
  indoorStart: number | null;
  indoorEnd: number | null;
  seedlingStart: number | null;
  seedlingEnd: number | null;
  outdoorStart: number | null;
  outdoorEnd: number | null;
}

const ARCHETYPES = {
  // Start indoors Feb–Mar, transplant May, no direct-sow assumed.
  warmTransplant: {
    indoorStart: 1, // Feb
    indoorEnd: 2, // Mar
    seedlingStart: 4, // May
    seedlingEnd: 4, // May
    outdoorStart: 4, // May (direct-sow fallback also works)
    outdoorEnd: 5, // Jun
  },
  // Start indoors Feb, transplant Apr; can also direct-sow Mar–Apr.
  coolTransplant: {
    indoorStart: 1, // Feb
    indoorEnd: 2, // Mar
    seedlingStart: 3, // Apr
    seedlingEnd: 4, // May
    outdoorStart: 2, // Mar
    outdoorEnd: 3, // Apr
  },
  // Direct-sow only after the soil warms (late spring).
  warmDirect: {
    indoorStart: null,
    indoorEnd: null,
    seedlingStart: null,
    seedlingEnd: null,
    outdoorStart: 4, // May
    outdoorEnd: 5, // Jun
  },
  // Direct-sow early; cold-tolerant.
  coolDirect: {
    indoorStart: null,
    indoorEnd: null,
    seedlingStart: null,
    seedlingEnd: null,
    outdoorStart: 2, // Mar
    outdoorEnd: 3, // Apr
  },
  // Planted in autumn for harvest the following season (garlic).
  fallPlanted: {
    indoorStart: null,
    indoorEnd: null,
    seedlingStart: null,
    seedlingEnd: null,
    outdoorStart: 9, // Oct
    outdoorEnd: 10, // Nov
  },
} satisfies Record<string, BaselineWindow>;

/**
 * Map each plant id to its baseline planting archetype.
 */
const PLANT_ARCHETYPE: Record<string, BaselineWindow> = {
  tomato: ARCHETYPES.warmTransplant,
  "bell-pepper": ARCHETYPES.warmTransplant,
  eggplant: ARCHETYPES.warmTransplant,
  basil: ARCHETYPES.warmTransplant,
  broccoli: ARCHETYPES.coolTransplant,
  cauliflower: ARCHETYPES.coolTransplant,
  lettuce: ARCHETYPES.coolTransplant,
  kale: ARCHETYPES.coolTransplant,
  onion: ARCHETYPES.coolTransplant,
  parsley: ARCHETYPES.coolTransplant,
  cucumber: ARCHETYPES.warmDirect,
  zucchini: ARCHETYPES.warmDirect,
  "winter-squash": ARCHETYPES.warmDirect,
  "green-bean": ARCHETYPES.warmDirect,
  "sweet-corn": ARCHETYPES.warmDirect,
  carrot: ARCHETYPES.coolDirect,
  beet: ARCHETYPES.coolDirect,
  spinach: ARCHETYPES.coolDirect,
  pea: ARCHETYPES.coolDirect,
  radish: ARCHETYPES.coolDirect,
  cilantro: ARCHETYPES.coolDirect,
  "swiss-chard": ARCHETYPES.coolDirect,
  potato: ARCHETYPES.coolDirect,
  garlic: ARCHETYPES.fallPlanted,
  // Water-wise / drought-tough edibles
  okra: ARCHETYPES.warmDirect,
  "tepary-bean": ARCHETYPES.warmDirect,
  amaranth: ARCHETYPES.warmDirect,
  sunflower: ARCHETYPES.warmDirect,
  melon: ARCHETYPES.warmTransplant,
  "sweet-potato": ARCHETYPES.warmTransplant,
  rosemary: ARCHETYPES.warmTransplant,
  sage: ARCHETYPES.warmTransplant,
  thyme: ARCHETYPES.warmTransplant,
  oregano: ARCHETYPES.warmTransplant,
  lavender: ARCHETYPES.warmTransplant,
};

/** Fallback for any plant id missing from the map above. */
const DEFAULT_BASELINE: BaselineWindow = ARCHETYPES.coolDirect;

/**
 * Compute the recommended planting windows for a plant in a given USDA zone.
 *
 * Returns month-name strings (e.g. 'Mar', 'Apr') for each phase, shifting the
 * crop's baseline (zone-6) calendar earlier for warmer zones and later for
 * colder ones via {@link zoneMonthOffset}. Phases that don't apply to a crop
 * (e.g. indoor starting for direct-sow plants) are returned as `null`.
 *
 * If `zone` isn't one of the plant's supported `zones`, the windows are still
 * computed (callers may want to show "out of range" separately), but the math
 * remains consistent.
 *
 * @example
 *   plantingWindows(plants[0], 9)
 *   // tomato in zone 9 → windows shifted ~2 months earlier than zone 6
 */
export function plantingWindows(plant: Plant, zone: number): PlantingWindows {
  const baseline = PLANT_ARCHETYPE[plant.id] ?? DEFAULT_BASELINE;
  const offset = zoneMonthOffset(zone);

  const shift = (index: number | null): MonthName | null =>
    index === null ? null : monthName(index + offset);

  return {
    indoorStart: shift(baseline.indoorStart),
    indoorEnd: shift(baseline.indoorEnd),
    seedlingStart: shift(baseline.seedlingStart),
    seedlingEnd: shift(baseline.seedlingEnd),
    outdoorStart: shift(baseline.outdoorStart),
    outdoorEnd: shift(baseline.outdoorEnd),
  };
}

/** Convenience lookup helpers. */

/** Find a plant by its kebab-case id. */
export function getPlantById(id: string): Plant | undefined {
  return plants.find((p) => p.id === id);
}

/**
 * Zone used for crop matching. The dataset's `zones` arrays top out at 11, but
 * real lookups can return tropical zones 12–13 (Puerto Rico/USVI, Hawaii,
 * Guam). Anything a zone-11 gardener can grow, a zone-12/13 gardener can too,
 * so tropical zones share the zone-11 crop list instead of matching nothing.
 */
export function matchableZone(zone: number): number {
  return Math.min(zone, 11);
}

/** All plants that can be grown in the given USDA zone (see matchableZone). */
export function plantsForZone(zone: number): Plant[] {
  const match = matchableZone(zone);
  return plants.filter((p) => p.zones.includes(match));
}
