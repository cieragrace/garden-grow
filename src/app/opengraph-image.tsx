import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

/**
 * Site-wide Open Graph card, generated at build time in the app's own palette
 * (see globals.css @theme). Twitter cards fall back to this image too.
 */

export const alt = `${SITE_NAME} — find what to plant in your zone`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f4ec",
          border: "24px solid #2f6b3d",
        }}
      >
        <div style={{ display: "flex", fontSize: 120 }}>🌱</div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 88,
            fontWeight: 700,
            color: "#2f6b3d",
          }}
        >
          {SITE_NAME}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 36,
            color: "#5a5147",
          }}
        >
          ZIP code → USDA zone → what you can grow
        </div>
      </div>
    ),
    { ...size, emoji: "openmoji" },
  );
}
