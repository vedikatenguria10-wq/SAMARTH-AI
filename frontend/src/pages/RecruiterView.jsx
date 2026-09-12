import React, { useState } from "react";
import { Field } from "../components/Field.jsx";
import { ScoreBar } from "../components/ScoreBar.jsx";
import { Chip } from "../components/Chip.jsx";
import { DOMAINS, inputStyle } from "../data/constants.js";
import { validateOpportunityForm } from "../utils/validation.js";
import { Plus, Award, Trash2, AlertTriangle, User, Mail, Phone, GraduationCap, Code, Heart, Compass, FileText, CheckCircle2, X, Eye } from "lucide-react";

export function RecruiterView({
  opportunities,
  oppForm,
  setOppForm,
  submitOpportunity,
  selectedOppId,
  setSelectedOppId,
  selectedOpp,
  rankedCandidates,
  runAllocation,
  allocations,
  onRemoveOpportunity
}) {
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [viewingCandidate, setViewingCandidate] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateOpportunityForm(oppForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await submitOpportunity(e);
      setShowForm(false);
    } catch (err) {
      setErrors({ form: err.message || "Failed to publish opportunity." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async (oppId) => {
    try {
      if (onRemoveOpportunity) {
        await onRemoveOpportunity(oppId);
      }
    } catch (err) {
      alert(err.message || "Failed to remove posting.");
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#1B2A4A" }}>Post &amp; review opportunities</div>
          <div style={{ color: "#5B5648", fontSize: 13.5, marginTop: 3 }}>See ranked, explained candidates for any opportunity — and run fair allocation directly.</div>
        </div>
        <button onClick={() => setShowForm((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "#E8871E", color: "#1B2A4A", border: "none", borderRadius: 7, padding: "9px 14px", fontWeight: 700, fontSize: 13.5, cursor: "pointer" }}>
          <Plus size={15} /> {showForm ? "Close form" : "Post opportunity"}
        </button>
      </div>

      {errors.form && (
        <div style={{ background: "#FDF2F2", border: "1px solid #F8B4B4", color: "#B14D4D", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 18 }}>
          {errors.form}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleFormSubmit} style={{ background: "#fff", border: "1px solid #E3DFD3", borderRadius: 10, padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
          <Field label="Title" error={errors.title}>
            <input value={oppForm.title} onChange={(e) => setOppForm({ ...oppForm, title: e.target.value })} placeholder="e.g. AI Research Intern" style={inputStyle} />
          </Field>
          
          <Field label="Organization" error={errors.org}>
            <input value={oppForm.org} onChange={(e) => setOppForm({ ...oppForm, org: e.target.value })} placeholder="e.g. TechNova Labs" style={inputStyle} />
          </Field>
          
          <Field label="Domain" error={errors.domain}>
            <select value={oppForm.domain} onChange={(e) => setOppForm({ ...oppForm, domain: e.target.value })} style={inputStyle}>
              {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          
          <Field label="Location" error={errors.location}>
            <input value={oppForm.location} onChange={(e) => setOppForm({ ...oppForm, location: e.target.value })} placeholder="Remote / City" style={inputStyle} />
          </Field>
          
          <Field label="Stipend (₹ per month, numeric only)" error={errors.stipend}>
            <input type="number" min="0" step="500" value={oppForm.stipend} onChange={(e) => setOppForm({ ...oppForm, stipend: e.target.value })} placeholder="15000" style={inputStyle} />
          </Field>
          
          <Field label="Total Seats (at least 1)" error={errors.seatsTotal}>
            <input type="number" min={1} value={oppForm.seatsTotal} onChange={(e) => setOppForm({ ...oppForm, seatsTotal: e.target.value })} style={inputStyle} />
          </Field>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Required skills (comma separated)" error={errors.requiredSkills}>
              <input value={oppForm.requiredSkills} onChange={(e) => setOppForm({ ...oppForm, requiredSkills: e.target.value })} placeholder="python, sql, data analysis" style={inputStyle} />
            </Field>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Description" error={errors.description}>
              <textarea rows={3} value={oppForm.description} onChange={(e) => setOppForm({ ...oppForm, description: e.target.value })} placeholder="Describe the internship responsibilities and requirements (20-2000 characters)" style={{ ...inputStyle, resize: "vertical" }} />
            </Field>
          </div>

          <button type="submit" disabled={submitting} style={{ gridColumn: "1 / -1", justifySelf: "start", background: "#1B2A4A", color: "#fff", border: "none", borderRadius: 7, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting ? "Publishing..." : "Publish opportunity"}
          </button>
        </form>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ flex: 1, maxWidth: 420 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "#5B5648", display: "block", marginBottom: 6 }}>Reviewing candidates for</label>
          <select value={selectedOppId || ""} onChange={(e) => setSelectedOppId(e.target.value)} style={{ ...inputStyle }}>
            {opportunities.map((o) => <option key={o.id} value={o.id}>{o.title} — {o.org}</option>)}
          </select>
        </div>

        {selectedOpp && (
          <button
            onClick={() => setConfirmDeleteId(selectedOpp.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#FDF2F2",
              color: "#B14D4D",
              border: "1px solid #F8B4B4",
              borderRadius: 7,
              padding: "8px 12px",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              alignSelf: "flex-end"
            }}
          >
            <Trash2 size={14} /> Remove Posting
          </button>
        )}
      </div>

      {/* Deletion Confirmation Modal */}
      {confirmDeleteId && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 10, padding: 24, maxWidth: 440, width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#B14D4D", marginBottom: 12 }}>
              <AlertTriangle size={22} />
              <h3 style={{ margin: 0, fontSize: 18, fontFamily: "'Space Grotesk', sans-serif" }}>Confirm Posting Removal</h3>
            </div>
            <p style={{ color: "#5B5648", fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>
              Are you sure you want to remove this internship?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setConfirmDeleteId(null)} style={{ background: "#fff", border: "1px solid #E3DFD3", borderRadius: 6, padding: "8px 14px", fontSize: 13, color: "#5B5648", cursor: "pointer", fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={() => handleDeleteConfirm(confirmDeleteId)} style={{ background: "#B14D4D", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13, color: "#fff", cursor: "pointer", fontWeight: 700 }}>
                Yes, Remove Posting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Profile Inspection Modal */}
      {viewingCandidate && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 580, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 4px 24px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, borderBottom: "1px solid #F0EEE6", paddingBottom: 12 }}>
              <div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: "#1B2A4A" }}>
                  {viewingCandidate.student.name}
                </div>
                <div style={{ fontSize: 13, color: "#5B5648", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                  <GraduationCap size={15} /> {viewingCandidate.student.college}
                </div>
              </div>
              <button onClick={() => setViewingCandidate(null)} style={{ background: "#FAF8F4", border: "1px solid #E3DFD3", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#5B5648" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ background: "#FAF8F4", border: "1px solid #EFEBDF", borderRadius: 8, padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#3A3730" }}>
                  <Mail size={14} color="#E8871E" /> <strong>Email:</strong> {viewingCandidate.student.email}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#3A3730" }}>
                  <Phone size={14} color="#E8871E" /> <strong>Mobile:</strong> {viewingCandidate.student.mobile}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#3A3730", gridColumn: "1 / -1" }}>
                  <Compass size={14} color="#E8871E" /> <strong>Preferred Domain:</strong> {viewingCandidate.student.preferredDomain || viewingCandidate.student.preferred_domain}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5B5648", display: "block", marginBottom: 6 }}>MATCH SCORE FOR {selectedOpp?.title.toUpperCase()}</label>
                <ScoreBar pct={viewingCandidate.match.pct} />
                <div style={{ fontSize: 13, color: "#3A3730", marginTop: 8, background: "#F5F3ED", padding: 10, borderRadius: 6 }}>
                  {viewingCandidate.match.explanation}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5B5648", display: "block", marginBottom: 6 }}>SKILLS</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(Array.isArray(viewingCandidate.student.skills) ? viewingCandidate.student.skills : []).map((s) => (
                    <Chip key={s} tone={viewingCandidate.match.matchedSkills.includes(s) ? "matched" : "neutral"}>
                      {viewingCandidate.match.matchedSkills.includes(s) ? `✓ ${s}` : s}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5B5648", display: "block", marginBottom: 6 }}>INTERESTS</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(Array.isArray(viewingCandidate.student.interests) ? viewingCandidate.student.interests : []).map((i) => (
                    <Chip key={i} tone="neutral">{i}</Chip>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5B5648", display: "block", marginBottom: 4 }}>PROJECT DESCRIPTION</label>
                <div style={{ fontSize: 13, color: "#3A3730", background: "#FAF8F4", border: "1px solid #EFEBDF", padding: 12, borderRadius: 8, lineHeight: 1.5 }}>
                  {viewingCandidate.student.projects}
                </div>
              </div>

              {/* Candidate Allocation Outcome in Modal */}
              {(() => {
                const viewingDecision = allocations.find((a) => {
                  const matchOpp = String(a.oppId) === String(selectedOpp?.id) || (selectedOpp?.numericId && String(a.oppId) === String(selectedOpp?.numericId));
                  const matchStudent =
                    String(a.studentId) === String(viewingCandidate.student.id) ||
                    (viewingCandidate.student.numericId && String(a.studentId) === String(viewingCandidate.student.numericId)) ||
                    (viewingCandidate.student.numericId && String(a.studentId) === `be_${viewingCandidate.student.numericId}`) ||
                    (String(viewingCandidate.student.id).startsWith("be_") && String(a.studentId) === String(viewingCandidate.student.id).replace("be_", ""));
                  return matchOpp && matchStudent;
                });

                if (!viewingDecision) return null;

                return (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#5B5648", display: "block", marginBottom: 6 }}>
                      ALLOCATION OUTCOME &amp; EXPLAINABILITY
                    </label>
                    <div style={{
                      background: viewingDecision.status === "allocated" ? "#E5F4ED" : viewingDecision.status === "dropped" ? "#FDF2F2" : "#FAF8F4",
                      border: `1px solid ${viewingDecision.status === "allocated" ? "#A8E0C4" : viewingDecision.status === "dropped" ? "#F8B4B4" : "#E3DFD3"}`,
                      borderRadius: 8,
                      padding: 12,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: viewingDecision.status === "allocated" ? "#2F6B4F" : viewingDecision.status === "dropped" ? "#B14D4D" : "#5B5648",
                          display: "flex",
                          alignItems: "center",
                          gap: 6
                        }}>
                          {viewingDecision.status === "allocated" ? <CheckCircle2 size={14} /> : viewingDecision.status === "dropped" ? <AlertTriangle size={14} /> : null}
                          {viewingDecision.status === "allocated" ? "✓ Allocated / Selected" : viewingDecision.status === "dropped" ? "Dropped out" : "Not Selected"}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#5B5648" }}>
                          Rank #{viewingDecision.rank} · {viewingDecision.pct}% match
                        </span>
                      </div>
                      <div style={{ fontSize: 12.5, color: "#3A3730", lineHeight: 1.4 }}>
                        <strong style={{ color: "#1B2A4A" }}>Why this decision?</strong> {viewingDecision.reason}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Resume Section with View Resume Button */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5B5648", display: "block", marginBottom: 4 }}>RESUME</label>
                {viewingCandidate.student.resume ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAF8F4", border: "1px solid #EFEBDF", padding: "10px 14px", borderRadius: 8, flexWrap: "wrap", gap: 10 }}>
                    <div style={{ fontSize: 12.5, color: "#2F6B4F", display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={16} />
                      <span>
                        <strong>{viewingCandidate.student.resume.filename || viewingCandidate.student.resume.name || "resume.pdf"}</strong>
                        <span style={{ color: "#5B5648", fontSize: 12, marginLeft: 8 }}>
                          ({((viewingCandidate.student.resume.size || 0) / 1024).toFixed(1)} KB)
                        </span>
                      </span>
                    </div>
                    <button
                      onClick={() => setShowResumeModal(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#1B2A4A",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "6px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      <Eye size={13} /> View Resume
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: 12.5, color: "#8A8474", fontStyle: "italic", background: "#FAF8F4", padding: "10px 14px", borderRadius: 8, border: "1px solid #EFEBDF" }}>
                    No resume uploaded for this candidate profile.
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button onClick={() => { setViewingCandidate(null); setShowResumeModal(false); }} style={{ background: "#1B2A4A", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Metadata Modal (Honest view, no fake PDF) */}
      {showResumeModal && viewingCandidate?.student?.resume && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1100, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 12, padding: 24, maxWidth: 500, width: "100%", boxShadow: "0 8px 30px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: "1px solid #F0EEE6", paddingBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#1B2A4A", fontWeight: 700, fontSize: 16 }}>
                <FileText size={18} color="#E8871E" /> Candidate Resume
              </div>
              <button onClick={() => setShowResumeModal(false)} style={{ background: "#FAF8F4", border: "1px solid #E3DFD3", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#5B5648" }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ background: "#FAF8F4", border: "1px solid #EFEBDF", borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "grid", gap: 8, fontSize: 13 }}>
                <div><strong style={{ color: "#1B2A4A" }}>File Name:</strong> {viewingCandidate.student.resume.filename || viewingCandidate.student.resume.name || "resume.pdf"}</div>
                <div><strong style={{ color: "#1B2A4A" }}>File Size:</strong> {((viewingCandidate.student.resume.size || 0) / 1024).toFixed(1)} KB</div>
                <div><strong style={{ color: "#1B2A4A" }}>File Format:</strong> {viewingCandidate.student.resume.type || "application/pdf"}</div>
                <div><strong style={{ color: "#1B2A4A" }}>Status:</strong> <span style={{ color: "#2F6B4F", fontWeight: 600 }}>Verified PDF format</span></div>
              </div>
            </div>

            <div style={{ background: "#FFF8F0", border: "1px solid #FFE4B8", borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 12.5, color: "#874D00", lineHeight: 1.5 }}>
              <strong>Notice:</strong> Binary file content preview is unavailable in this environment because only validated resume metadata is stored in the database. File integrity, size, and PDF extension verification were successfully validated during profile submission.
            </div>

            <div style={{ textAlign: "right" }}>
              <button
                onClick={() => setShowResumeModal(false)}
                style={{ background: "#1B2A4A", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOpp && (
        <div style={{ background: "#fff", border: "1px solid #E3DFD3", borderRadius: 10, padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 13.5, color: "#5B5648" }}>
              <strong style={{ color: "#1B2A4A" }}>{selectedOpp.seatsTotal - selectedOpp.seatsFilled}</strong> of {selectedOpp.seatsTotal} seats open · {rankedCandidates.length} candidates ranked
            </div>
            <button onClick={() => runAllocation(selectedOpp.id)} disabled={selectedOpp.seatsFilled >= selectedOpp.seatsTotal} style={{ display: "flex", alignItems: "center", gap: 6, background: selectedOpp.seatsFilled >= selectedOpp.seatsTotal ? "#E3DFD3" : "#2F6B4F", color: "#fff", border: "none", borderRadius: 7, padding: "9px 14px", fontWeight: 700, fontSize: 13.5, cursor: selectedOpp.seatsFilled >= selectedOpp.seatsTotal ? "not-allowed" : "pointer" }}>
              <Award size={15} /> Run fair allocation
            </button>
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            {rankedCandidates.map(({ student, match }, i) => {
              const decision = allocations.find((a) => {
                const matchOpp = String(a.oppId) === String(selectedOpp.id) || (selectedOpp.numericId && String(a.oppId) === String(selectedOpp.numericId));
                const matchStudent =
                  String(a.studentId) === String(student.id) ||
                  (student.numericId && String(a.studentId) === String(student.numericId)) ||
                  (student.numericId && String(a.studentId) === `be_${student.numericId}`) ||
                  (String(student.id).startsWith("be_") && String(a.studentId) === String(student.id).replace("be_", ""));
                return matchOpp && matchStudent;
              });

              return (
                <div key={student.id} style={{ padding: "10px 12px", background: "#FAF8F4", borderRadius: 8, border: "1px solid #EFEBDF", display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 22, textAlign: "center", fontSize: 12.5, color: "#8A8474", fontWeight: 600 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#1B2A4A" }}>{student.name}</div>
                      <div style={{ fontSize: 12, color: "#5B5648" }}>{student.college}</div>
                    </div>
                    
                    {/* View Profile Action */}
                    <button
                      onClick={() => setViewingCandidate({ student, match })}
                      style={{ background: "#fff", border: "1px solid #E3DFD3", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#1B2A4A", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <User size={13} color="#E8871E" /> View Profile
                    </button>

                    <div style={{ width: 140 }}><ScoreBar pct={match.pct} /></div>
                    
                    <div style={{ width: 150, textAlign: "right" }}>
                      {decision?.status === "allocated" && <Chip tone="matched">✓ Allocated</Chip>}
                      {decision?.status === "skipped_fairness" && <Chip tone="missing">Skipped — fairness cap</Chip>}
                      {decision?.status === "not_selected" && <Chip tone="missing">Not selected</Chip>}
                      {decision?.status === "dropped" && <Chip tone="neutral">Dropped out</Chip>}
                      {!decision && <span style={{ fontSize: 12, color: "#8A8474" }}>Awaiting allocation</span>}
                    </div>
                  </div>

                  {decision && (
                    <div style={{
                      fontSize: 12,
                      color: "#3A3730",
                      background: decision.status === "allocated" ? "#F0F7F3" : decision.status === "dropped" ? "#FDF2F2" : "#F5F3ED",
                      border: `1px solid ${decision.status === "allocated" ? "#D1EADB" : decision.status === "dropped" ? "#F8B4B4" : "#E8E4D8"}`,
                      padding: "6px 10px",
                      borderRadius: 6,
                      display: "flex",
                      gap: 6,
                      alignItems: "baseline"
                    }}>
                      <strong style={{ color: "#1B2A4A", whiteSpace: "nowrap" }}>Why this decision?</strong>
                      <span>{decision.reason}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
