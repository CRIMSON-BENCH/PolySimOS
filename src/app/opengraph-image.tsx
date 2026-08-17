import { ImageResponse } from "next/og";

export const alt = "PolySim OS — The Everything Engine for simulation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded default OpenGraph/Twitter card for the whole site.
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: "#020617", color: "#e2e8f0",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
          <div style={{ width: 96, height: 96, borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#06b6d4,#84cc16)", fontSize: 64, fontWeight: 900, color: "#020617" }}>P</div>
          <div style={{ fontSize: 60, fontWeight: 800 }}>PolySim OS</div>
        </div>
        <div style={{ fontSize: 46, fontWeight: 800, maxWidth: 950, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
          <span>The Everything Engine for</span>
          <span style={{ color: "#22d3ee" }}>simulation</span>
        </div>
        <div style={{ fontSize: 28, color: "#94a3b8", marginTop: 20, textAlign: "center", maxWidth: 860 }}>
          Physics · Biology · Chemistry · Math — in your browser, free
        </div>
      </div>
    ),
    size
  );
}
