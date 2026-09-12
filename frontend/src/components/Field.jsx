import React from "react";

export function Field({ label, error, children }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#5B5648", marginBottom: 5 }}>{label}</div>
      {children}
      {error && (
        <div style={{ color: "#B14D4D", fontSize: 12, marginTop: 4, fontWeight: 500 }}>
          {error}
        </div>
      )}
    </label>
  );
}
