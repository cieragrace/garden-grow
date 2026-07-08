/**
 * GrowingSprout — the hero's living mascot. A pure-CSS animated sprout that
 * grows out of the soil, unfurls two leaves, pops a carrot-colored bloom,
 * then sways gently forever. Server component; all motion lives in
 * globals.css (keyframes prefixed gg-sprout-*) and is disabled under
 * prefers-reduced-motion, where it renders fully grown and still.
 */

export default function GrowingSprout({ className }: { className?: string }) {
  return (
    <span className={`gg-sprout ${className ?? ""}`} aria-hidden="true">
      <svg
        viewBox="0 0 120 110"
        width={96}
        height={88}
        role="presentation"
        focusable="false"
      >
        {/* Soil */}
        <ellipse cx={60} cy={103} rx={34} ry={5} fill="#D4E2CD" />
        <ellipse cx={60} cy={102} rx={20} ry={3.5} fill="#A9C4A0" />

        {/* The plant grows from the soil line */}
        <g className="gg-sprout-plant">
          <path
            d="M60 103 C 59 85, 61 72, 60 58"
            stroke="#2F6B3D"
            strokeWidth={3.5}
            fill="none"
            strokeLinecap="round"
          />
          <path
            className="gg-sprout-leaf gg-sprout-leaf-l"
            d="M59.5 86 C 48 84, 42 76, 41 68 C 52 68, 59 75, 59.5 86 Z"
            fill="#4A7C59"
          />
          <path
            className="gg-sprout-leaf gg-sprout-leaf-r"
            d="M60.5 74 C 72 72, 78 64, 79 56 C 68 56, 61 63, 60.5 74 Z"
            fill="#6FA86B"
          />
          <g className="gg-sprout-bloom">
            <circle cx={67} cy={58} r={5.5} fill="#E08A4B" />
            <circle cx={62.2} cy={64.7} r={5.5} fill="#E08A4B" />
            <circle cx={54.3} cy={62.1} r={5.5} fill="#E08A4B" />
            <circle cx={54.3} cy={53.9} r={5.5} fill="#E08A4B" />
            <circle cx={62.2} cy={51.3} r={5.5} fill="#E08A4B" />
            <circle cx={60} cy={58} r={4.5} fill="#C5713A" />
          </g>
        </g>
      </svg>
    </span>
  );
}
