import React from "react";

export function ScoreBar({ pct }) {
  const color = pct >= 75 ? "#2F6B4F" : pct >= 50 ? "#E8871E" : "#B14D4D";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#EAE6DC", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.4s ease" }} />
      </div>
      <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 14, color: "#1B2A4A", minWidth: 40, textAlign: "right" }}>{pct}%</span>
    </div>
  );
}
