"use client";

import { useGarden } from "@/lib/useGarden";

interface SaveButtonProps {
  plantId: string;
  plantName: string;
  /** "full" for the detail page, "compact" for cards. */
  variant?: "full" | "compact";
  className?: string;
}

export default function SaveButton({
  plantId,
  plantName,
  variant = "full",
  className = "",
}: SaveButtonProps) {
  const { isSaved, toggle } = useGarden();
  const saved = isSaved(plantId);

  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-soft";
  const size = variant === "full" ? "px-5 py-2.5" : "px-3 py-1.5 text-sm";
  const tone = saved
    ? "border border-sage text-garden hover:bg-sage-soft"
    : "bg-carrot text-soil hover:bg-carrot-deep";

  return (
    <button
      type="button"
      onClick={() => toggle(plantId)}
      aria-pressed={saved}
      aria-label={
        saved
          ? `Remove ${plantName} from My Garden`
          : `Save ${plantName} to My Garden`
      }
      className={`${base} ${size} ${tone} ${className}`}
    >
      <span aria-hidden="true">{saved ? "✓" : "＋"}</span>
      {saved ? "In My Garden" : "Save to My Garden"}
    </button>
  );
}
