import React from "react";

export function Chip({ children, tone = "neutral" }) {
  const tones = {
    matched: { bg: "#EAF3ED", color: "#2F6B4F", border: "#CFE4D8" },
    missing: { bg: "#FBF0E4", color: "#9A5B12", border: "#F0DBBB" },
    neutral: { bg: "#F1EFE8", color: "#5B5648", border: "#E3DFD3" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{ background: t.bg, color: t.color, border: `1px solid ${t.border}`, borderRadius: 6, padding: "3px 9px", fontSize: 12.5, fontWeight: 500 }}>
      {children}
    </span>
  );
}
