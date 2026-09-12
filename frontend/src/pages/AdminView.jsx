import React from "react";
import { StatCard } from "../components/StatCard.jsx";
import { ScoreBar } from "../components/ScoreBar.jsx";
import { Users, Briefcase, CheckCircle2, TrendingUp, RefreshCw, ShieldCheck, XCircle } from "lucide-react";

export function AdminView({ opportunities, students, allocations, totalSeats, filledSeats, simulateDropout }) {
  const activeAllocations = allocations.filter((a) => a.status === "allocated").sort((a, b) => b.ts - a.ts);
  const log = [...allocations].sort((a, b) => b.ts - a.ts);

  return (
    <div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#1B2A4A", marginBottom: 4 }}>Allocation dashboard</div>
      <div style={{ color: "#5B5648", fontSize: 13.5, marginBottom: 20 }}>Real-time seat tracking and a fully transparent, auditable decision log.</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 26 }}>
        <StatCard label="Students" value={students.length} icon={Users} />
        <StatCard label="Opportunities" value={opportunities.length} icon={Briefcase} />
        <StatCard label="Seats filled" value={`${filledSeats} / ${totalSeats}`} icon={CheckCircle2} />
        <StatCard label="Allocation decisions" value={allocations.length} icon={TrendingUp} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1B2A4A", marginBottom: 10 }}>Seats by opportunity</div>
          <div style={{ display: "grid", gap: 8 }}>
            {opportunities.map((o) => {
              const pct = Math.round((o.seatsFilled / o.seatsTotal) * 100);
              return (
                <div key={o.id} style={{ background: "#fff", border: "1px solid #E3DFD3", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, color: "#1B2A4A" }}>{o.title}</span>
                    <span style={{ color: "#5B5648" }}>{o.seatsFilled}/{o.seatsTotal}</span>
                  </div>
                  <ScoreBar pct={pct} />
                </div>
              );
            })}
          </div>

          <div style={{ fontWeight: 700, fontSize: 15, color: "#1B2A4A", margin: "22px 0 10px" }}>Allocated — simulate a dropout (self-healing seats)</div>
          <div style={{ display: "grid", gap: 8 }}>
            {activeAllocations.length === 0 && <div style={{ fontSize: 13, color: "#8A8474" }}>No allocations yet — run allocation from the "Post & Review" tab.</div>}
            {activeAllocations.map((a) => {
              const student = students.find((s) => String(s.id) === String(a.studentId) || (s.numericId && String(s.numericId) === String(a.studentId)) || (s.numericId && `be_${s.numericId}` === String(a.studentId)));
              const opp = opportunities.find((o) => String(o.id) === String(a.oppId) || (o.numericId && String(o.numericId) === String(a.oppId)));
              return (
                <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: "1px solid #E3DFD3", borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 13 }}>
                    <strong style={{ color: "#1B2A4A" }}>{student?.name || "Student"}</strong> <span style={{ color: "#5B5648" }}>→ {opp?.title || "Opportunity"}</span>
                  </div>
                  <button onClick={() => simulateDropout(a)} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid #E3DFD3", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#B14D4D", cursor: "pointer" }}>
                    <RefreshCw size={12} /> Simulate dropout
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1B2A4A", marginBottom: 10 }}>Transparency log</div>
          <div style={{ background: "#fff", border: "1px solid #E3DFD3", borderRadius: 10, padding: 14, maxHeight: 560, overflowY: "auto", display: "grid", gap: 10 }}>
            {log.length === 0 && <div style={{ fontSize: 13, color: "#8A8474" }}>No decisions yet.</div>}
            {log.map((entry) => {
              const student = students.find((s) => String(s.id) === String(entry.studentId) || (s.numericId && String(s.numericId) === String(entry.studentId)) || (s.numericId && `be_${s.numericId}` === String(entry.studentId)));
              const opp = opportunities.find((o) => String(o.id) === String(entry.oppId) || (o.numericId && String(o.numericId) === String(entry.oppId)));
              const icon = entry.status === "allocated" ? <CheckCircle2 size={16} color="#2F6B4F" /> : entry.status === "skipped_fairness" ? <ShieldCheck size={16} color="#9A5B12" /> : entry.status === "dropped" ? <RefreshCw size={16} color="#B14D4D" /> : <XCircle size={16} color="#8A8474" />;
              return (
                <div key={entry.id} style={{ display: "flex", gap: 10, paddingBottom: 10, borderBottom: "1px solid #F0EEE6", alignItems: "flex-start" }}>
                  <div style={{ marginTop: 2 }}>{icon}</div>
                  <div style={{ fontSize: 12.5, color: "#3A3730", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                      <strong style={{ color: "#1B2A4A" }}>{student?.name || "Candidate"}</strong>
                      <span style={{ color: "#5B5648" }}>— {opp?.title || "Opportunity"}</span>
                      {entry.status === "dropped" && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#B14D4D", background: "#FDF2F2", border: "1px solid #F8B4B4", padding: "1px 6px", borderRadius: 4 }}>
                          Dropped — offer released
                        </span>
                      )}
                      {entry.isReheal && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#2F6B4F", background: "#E5F4ED", border: "1px solid #A8E0C4", padding: "1px 6px", borderRadius: 4 }}>
                          Self-healing reallocated
                        </span>
                      )}
                    </div>
                    <div style={{ color: "#5B5648", marginTop: 3, lineHeight: 1.4 }}>{entry.reason}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
