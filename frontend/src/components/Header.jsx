import React from "react";
import { Sparkles, GraduationCap, Building2, ShieldCheck, LogOut, UserCheck } from "lucide-react";

export function Header({ view, setView, user, onLogout }) {
  return (
    <div style={{ background: "#1B2A4A", color: "#fff", padding: "22px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Sparkles size={22} color="#E8871E" />
          <div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 20, letterSpacing: 0.2 }}>SAMARTH AI</div>
            <div style={{ fontSize: 12.5, color: "#B9C2D6" }}>Explainable, fair internship matching &amp; allocation</div>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <nav style={{ display: "flex", gap: 6, background: "#24365E", padding: 4, borderRadius: 8 }}>
            {[
              { key: "student", label: "Find Internships", icon: GraduationCap, roles: ["student", "recruiter", "admin"] },
              { key: "recruiter", label: "Post & Review", icon: Building2, roles: ["recruiter", "admin"] },
              { key: "admin", label: "Allocation Dashboard", icon: ShieldCheck, roles: ["admin"] },
            ]
            .filter(item => !user || item.roles.includes(user.role))
            .map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 6,
                  border: "none", fontSize: 13.5, fontWeight: 600,
                  background: view === key ? "#E8871E" : "transparent",
                  color: view === key ? "#1B2A4A" : "#D8DEEB",
                  cursor: "pointer"
                }}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </nav>

          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, borderLeft: "1px solid #364B78", paddingLeft: 12 }}>
              <div style={{ fontSize: 12.5, textAlign: "right" }}>
                <div style={{ fontWeight: 600, color: "#FFF", display: "flex", alignItems: "center", gap: 4 }}>
                  <UserCheck size={14} color="#E8871E" /> {user.email}
                </div>
                <span style={{ fontSize: 11, background: "#E8871E22", color: "#E8871E", padding: "1px 6px", borderRadius: 4, textTransform: "uppercase", fontWeight: 700 }}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                style={{
                  background: "transparent",
                  border: "1px solid #364B78",
                  color: "#D8DEEB",
                  borderRadius: 6,
                  padding: "6px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
