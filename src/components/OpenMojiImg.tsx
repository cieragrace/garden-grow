"use client";

/**
 * OpenMojiImg — the interactive <img> half of VeggieIcon, isolated into a tiny
 * client component so it can use onError. If the OpenMoji SVG is missing/404s,
 * we hide the broken image and render the raw emoji span instead, matching the
 * non-illustrated fallback path in VeggieIcon.
 *
 * Kept separate so VeggieIcon itself stays a server component and is not pulled
 * into the client bundle for server-rendered plant cards.
 */

import { useState } from "react";

interface OpenMojiImgProps {
  /** OpenMoji codepoint filename stem (no extension). */
  file: string;
  /** Raw emoji to fall back to if the SVG fails to load. */
  emoji: string;
  alt: string;
  size: number;
  className?: string;
}

export default function OpenMojiImg({
  file,
  emoji,
  alt,
  size,
  className,
}: OpenMojiImgProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className={className} style={{ fontSize: size * 0.9, lineHeight: 1 }}>
        {emoji}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/openmoji/${file}.svg`}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      style={{ display: "inline-block", verticalAlign: "middle" }}
      className={className}
    />
  );
}
