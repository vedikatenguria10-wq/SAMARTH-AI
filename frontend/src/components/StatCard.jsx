import React from "react";

export function StatCard({ label, value, icon: Icon }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E3DFD3", borderRadius: 10, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8A8474", fontSize: 12.5, marginBottom: 8 }}>
        {Icon && <Icon size={14} />} {label}
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "#1B2A4A" }}>{value}</div>
    </div>
  );
}
