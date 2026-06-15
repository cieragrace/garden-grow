/**
 * VeggieIcon — renders a plant's emoji as an illustrated OpenMoji SVG when we
 * have the matching file in /public/openmoji, falling back to the raw emoji
 * text otherwise. Server component (no hooks / no client boundary).
 *
 * When an OpenMoji SVG is missing/404s at runtime, the small client-only
 * <OpenMojiImg> below catches the load error and swaps in the raw emoji, so a
 * broken file degrades to the plain emoji instead of a broken-image glyph.
 *
 * Use this for PLANT icons only; decorative UI emoji (sun/water/calendar/step)
 * stay as plain emoji elsewhere.
 */

import OpenMojiImg from "./OpenMojiImg";

/**
 * Per-plant icon overrides (by name) for cases where two plants share an emoji
 * codepoint but should look different — e.g. cauliflower reuses the broccoli
 * emoji (🥦), so we point it at a white-floret variant SVG.
 */
const NAME_OVERRIDES: Record<string, string> = {
  Cauliflower: "cauliflower",
};

/** Codepoints we have illustrated SVGs for (filenames in /public/openmoji). */
const AVAILABLE = new Set([
  "1F345",
  "1FAD1",
  "1F955",
  "1FADC",
  "1F96C",
  "1F343",
  "1F952",
  "1F383",
  "1FADB",
  "1F966",
  "1F9C5",
  "1F9C4",
  "1F33F",
  "1F33D",
  "1F346",
  "1F954",
  // Colorado drought / xeriscape dataset additions
  "1F336", // 🌶️ hot pepper (okra)
  "1F348", // 🍈 melon
  "1F360", // 🍠 roasted sweet potato
  "1FAD8", // 🫘 beans (tepary bean)
  "1F33E", // 🌾 sheaf of rice (amaranth / blue grama grass)
  "1F33B", // 🌻 sunflower
  "1FABB", // 🪻 hyacinth (lavender / Russian sage / hyssop / catmint)
  "1F33C", // 🌼 blossom (yarrow / blanket flower / buckwheat)
  "1F338", // 🌸 cherry blossom (penstemon)
  "1F3F5", // 🏵️ rosette (rabbitbrush)
  "1F331", // 🌱 seedling (stonecrop / hops / creeping sedum)
  // Xeriscape vines & groundcovers additions
  "1F347", // 🍇 grapes (hardy grape)
  "1F340", // 🍀 four leaf clover (white clover)
  "1F33A", // 🌺 hibiscus (trumpet vine)
  "1F342", // 🍂 fallen leaf (Virginia creeper)
]);

/**
 * Convert an emoji string to its OpenMoji codepoint filename stem:
 * spread to code points, drop U+FE0F variation selectors, uppercase hex,
 * join multi-codepoint sequences with '-'.
 */
function toCodepoint(emoji: string): string {
  return [...emoji]
    .map((ch) => ch.codePointAt(0) ?? 0)
    .filter((cp) => cp !== 0xfe0f)
    .map((cp) => cp.toString(16).toUpperCase())
    .join("-");
}

interface VeggieIconProps {
  emoji: string;
  name?: string;
  size?: number;
  className?: string;
}

export default function VeggieIcon({
  emoji,
  name,
  size = 28,
  className,
}: VeggieIconProps) {
  const override = name ? NAME_OVERRIDES[name] : undefined;
  const code = toCodepoint(emoji);
  const file = override ?? (AVAILABLE.has(code) ? code : null);

  if (file) {
    return (
      <OpenMojiImg
        file={file}
        emoji={emoji}
        alt={name ?? ""}
        size={size}
        className={className}
      />
    );
  }

  return (
    <span className={className} style={{ fontSize: size * 0.9, lineHeight: 1 }}>
      {emoji}
    </span>
  );
}
