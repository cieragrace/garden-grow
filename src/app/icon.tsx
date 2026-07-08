import { ImageResponse } from "next/og";

/** Browser-tab favicon: seedling on the brand green, generated at build. */

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2f6b3d",
          borderRadius: 14,
          fontSize: 44,
        }}
      >
        🌱
      </div>
    ),
    { ...size, emoji: "openmoji" },
  );
}
