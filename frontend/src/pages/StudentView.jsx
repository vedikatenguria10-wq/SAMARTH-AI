import React, { useState, useEffect } from "react";
import { Field } from "../components/Field.jsx";
import { ScoreBar } from "../components/ScoreBar.jsx";
import { Chip } from "../components/Chip.jsx";
import { DOMAINS, inputStyle } from "../data/constants.js";
import { validateStudentForm } from "../utils/validation.js";
import { MapPin, Wallet, Users, Info, ChevronUp, ChevronDown, Upload, FileText, CheckCircle2, Send, XCircle, Clock } from "lucide-react";

export function StudentView({
  currentStudent,
  students,
  setCurrentStudentId,
  form,
  setForm,
  submitProfile,
  recommendations,
  expanded,
  toggleExpand,
  appliedOppIds = new Set(),
  onApply,
  applyingOppId,
  user,
  allocations = []
}) {
  const [errors, setErrors] = useState({});
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill email from logged in user if creating profile
  useEffect(() => {
    if (user && user.email && (!form.email || form.email !== user.email)) {
      setForm((prev) => ({ ...prev, email: user.email }));
    }
  }, [user]);

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, resume: "Resume file size must not exceed 2 MB." }));
    } else if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrors((prev) => ({ ...prev, resume: "Resume must be a PDF document (.pdf)." }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.resume;
        return next;
      });
    }

    setResumeFile(file);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateStudentForm(form, resumeFile);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const resumeMetadata = resumeFile ? {
        filename: resumeFile.name,
        size: resumeFile.size,
        type: resumeFile.type,
        uploaded_at: new Date().toISOString()
      } : null;

      await submitProfile(e, resumeMetadata);
    } catch (err) {
      setErrors({ form: err.message || "Failed to create student profile." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyClick = async (oppId) => {
    // Check if viewing a seed student preview (IDs starting with "s")
    const isSeedPreview = currentStudent && String(currentStudent.id).startsWith("s");
    if (isSeedPreview || !user || user.role !== "student") {
      alert("Demo Preview Mode: You are inspecting a demo student profile. To submit real applications, please log in with your registered student account.");
      return;
    }

    if (onApply) {
      await onApply(oppId);
    }
  };

  if (!currentStudent) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#1B2A4A" }}>Create your profile</div>
          <div style={{ color: "#5B5648", fontSize: 14, marginTop: 4 }}>Tell SAMARTH about your skills and interests — it'll rank every internship by how well it fits you, and explain why.</div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 22, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#5B5648" }}>Or preview as an existing seeded student:</span>
          {students.filter(s => String(s.id).startsWith("s")).slice(0, 5).map((s) => (
            <button key={s.id} onClick={() => setCurrentStudentId(s.id)} style={{ border: "1px solid #E3DFD3", background: "#fff", borderRadius: 6, padding: "6px 10px", fontSize: 12.5, color: "#1B2A4A", fontWeight: 500, cursor: "pointer" }}>
              {s.name}
            </button>
          ))}
        </div>

        {errors.form && (
          <div style={{ background: "#FDF2F2", border: "1px solid #F8B4B4", color: "#B14D4D", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 18, maxWidth: 640 }}>
            {errors.form}
          </div>
        )}

        <form onSubmit={handleFormSubmit} style={{ background: "#fff", border: "1px solid #E3DFD3", borderRadius: 10, padding: 24, display: "grid", gap: 16, maxWidth: 640 }}>
          <Field label="Full name" error={errors.name}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Aarav Sharma" style={inputStyle} />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Email Address" error={errors.email}>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. aarav@college.edu" style={inputStyle} />
            </Field>
            <Field label="Mobile Number (10 digits)" error={errors.mobile}>
              <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="e.g. 9876543210" style={inputStyle} />
            </Field>
          </div>

          <Field label="College / Institution" error={errors.college}>
            <input value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} placeholder="e.g. Acropolis Institute of Technology and Research" style={inputStyle} />
          </Field>

          <Field label="Skills (comma separated)" error={errors.skills}>
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. python, react, sql" style={inputStyle} />
          </Field>

          <Field label="Interests (comma separated)" error={errors.interests}>
            <input value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} placeholder="e.g. AI, design, policy" style={inputStyle} />
          </Field>

          <Field label="Preferred domain" error={errors.preferredDomain}>
            <select value={form.preferredDomain} onChange={(e) => setForm({ ...form, preferredDomain: e.target.value })} style={inputStyle}>
              {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>

          <Field label="Describe a project or two" error={errors.projects}>
            <textarea value={form.projects} onChange={(e) => setForm({ ...form, projects: e.target.value })} rows={3} placeholder="e.g. Built a React dashboard that visualizes district-level rainfall data." style={{ ...inputStyle, resize: "vertical" }} />
          </Field>

          <Field label="Resume (PDF only, max 2 MB)" error={errors.resume}>
            <div style={{ border: "1px dashed #C8C2B4", borderRadius: 7, padding: "14px 16px", background: "#FAF8F4", textAlign: "center" }}>
              <input type="file" accept=".pdf,application/pdf" id="resume-upload" style={{ display: "none" }} onChange={handleResumeChange} />
              <label htmlFor="resume-upload" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, color: "#1B2A4A", fontWeight: 600, fontSize: 13.5 }}>
                <Upload size={16} color="#E8871E" /> {resumeFile ? "Change PDF Resume" : "Upload PDF Resume"}
              </label>
              {resumeFile && (
                <div style={{ fontSize: 12.5, color: errors.resume ? "#B14D4D" : "#2F6B4F", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <FileText size={14} /> {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>
          </Field>

          <button type="submit" disabled={submitting} style={{ background: "#E8871E", color: "#1B2A4A", border: "none", borderRadius: 7, padding: "11px 18px", fontWeight: 700, fontSize: 14.5, justifySelf: "start", cursor: submitting ? "not-allowed" : "pointer" }}>
            {submitting ? "Saving Profile..." : "Create profile & see matches"}
          </button>
        </form>
      </div>
    );
  }

  function getAllocationForOpp(opp) {
    if (!allocations || !Array.isArray(allocations) || !currentStudent) return null;
    const oppIdStr = String(opp.id);
    const oppNumIdStr = opp.numericId ? String(opp.numericId) : "";
    const studentIdStr = String(currentStudent.id);
    const studentNumIdStr = currentStudent.numericId ? String(currentStudent.numericId) : "";

    const matches = allocations.filter((a) => {
      const matchOpp = String(a.oppId) === oppIdStr || (oppNumIdStr && String(a.oppId) === oppNumIdStr);
      const matchStudent =
        String(a.studentId) === studentIdStr ||
        (studentNumIdStr && String(a.studentId) === studentNumIdStr) ||
        (studentNumIdStr && String(a.studentId) === `be_${studentNumIdStr}`) ||
        (studentIdStr.startsWith("be_") && String(a.studentId) === studentIdStr.replace("be_", ""));
      return matchOpp && matchStudent;
    });

    if (matches.length === 0) return null;
    return matches.sort((a, b) => b.ts - a.ts)[0];
  }

  const isSeedPreview = String(currentStudent.id).startsWith("s");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, fontWeight: 700, color: "#1B2A4A" }}>
            Recommended for {currentStudent.name} {isSeedPreview && <span style={{ fontSize: 12, background: "#EFEBDF", padding: "2px 8px", borderRadius: 4, color: "#5B5648", fontWeight: 600 }}>DEMO PREVIEW</span>}
          </div>
          <div style={{ color: "#5B5648", fontSize: 13.5, marginTop: 3 }}>
            {currentStudent.college} · Skills: {Array.isArray(currentStudent.skills) ? currentStudent.skills.join(", ") : currentStudent.skills || "none listed"}
          </div>
          {currentStudent.resume && (
            <div style={{ fontSize: 12, color: "#2F6B4F", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <CheckCircle2 size={13} /> Resume attached: {currentStudent.resume.filename || currentStudent.resume.name || "PDF Attached"}
            </div>
          )}
        </div>
        <button onClick={() => setCurrentStudentId(null)} style={{ background: "none", border: "1px solid #E3DFD3", borderRadius: 6, padding: "7px 12px", fontSize: 13, color: "#5B5648", cursor: "pointer" }}>
          Switch profile
        </button>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {recommendations.map(({ opp, match }) => {
          const isOpen = expanded.has(opp.id);
          const isApplied = appliedOppIds.has(String(opp.id)) || (opp.numericId && appliedOppIds.has(String(opp.numericId)));
          const isApplying = String(applyingOppId) === String(opp.id);
          const openSeats = (opp.seatsTotal || 1) - (opp.seatsFilled || 0);

          const alloc = getAllocationForOpp(opp);
          const isSelected = alloc?.status === "allocated";
          const isDropped = alloc?.status === "dropped";
          const isNotSelected = alloc?.status === "skipped_fairness" || alloc?.status === "not_selected";

          return (
            <div key={opp.id} style={{ background: "#fff", border: "1px solid #E3DFD3", borderRadius: 10, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16.5, color: "#1B2A4A" }}>{opp.title}</div>
                  <div style={{ fontSize: 13.5, color: "#5B5648", marginTop: 2 }}>{opp.org} · {opp.domain}</div>
                  <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: 12.5, color: "#5B5648", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {opp.location}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Wallet size={13} /> ₹{opp.stipend ? Number(opp.stipend).toLocaleString('en-IN') : 0}/mo</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={13} /> {openSeats} of {opp.seatsTotal} seats open</span>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, width: 210 }}>
                  <ScoreBar pct={match.pct} />
                  
                  {/* Distinct Status Button / Badge */}
                  {isSelected ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#E5F4ED", color: "#2F6B4F", border: "1px solid #A8E0C4", borderRadius: 7, padding: "8px 14px", fontWeight: 700, fontSize: 13, width: "100%", justifyContent: "center" }}>
                      <CheckCircle2 size={14} /> ✓ Selected
                    </div>
                  ) : isDropped ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FDF2F2", color: "#B14D4D", border: "1px solid #F8B4B4", borderRadius: 7, padding: "8px 14px", fontWeight: 700, fontSize: 13, width: "100%", justifyContent: "center" }}>
                      <XCircle size={14} /> Dropped
                    </div>
                  ) : isNotSelected ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F5F3ED", color: "#8A8474", border: "1px solid #E3DFD3", borderRadius: 7, padding: "8px 14px", fontWeight: 700, fontSize: 13, width: "100%", justifyContent: "center" }}>
                      <XCircle size={14} /> Not Selected
                    </div>
                  ) : isApplied ? (
                    <button disabled style={{ display: "flex", alignItems: "center", gap: 6, background: "#E8F0FE", color: "#1A73E8", border: "1px solid #C2D7FA", borderRadius: 7, padding: "8px 14px", fontWeight: 700, fontSize: 13, width: "100%", justifyContent: "center", cursor: "not-allowed" }}>
                      <Clock size={14} /> Application submitted
                    </button>
                  ) : openSeats <= 0 ? (
                    <button disabled style={{ background: "#E3DFD3", color: "#777", border: "none", borderRadius: 7, padding: "8px 14px", fontWeight: 700, fontSize: 13, width: "100%", justifyContent: "center", cursor: "not-allowed" }}>
                      No seats available
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApplyClick(opp.id)}
                      disabled={isApplying}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#E8871E",
                        color: "#1B2A4A",
                        border: "none",
                        borderRadius: 7,
                        padding: "8px 14px",
                        fontWeight: 700,
                        fontSize: 13.5,
                        width: "100%",
                        justifyContent: "center",
                        cursor: isApplying ? "wait" : "pointer"
                      }}
                    >
                      <Send size={14} /> {isApplying ? "Submitting..." : "Apply Now"}
                    </button>
                  )}

                  <button onClick={() => toggleExpand(opp.id)} style={{ marginTop: 2, background: "none", border: "none", color: "#1B2A4A", fontSize: 12.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, padding: 0, cursor: "pointer" }}>
                    Why this match? {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Allocation Outcome & Explainability */}
              {alloc && (
                <div style={{
                  marginTop: 14,
                  background: isSelected ? "#F0F7F3" : isDropped ? "#FDF2F2" : "#F5F3ED",
                  border: `1px solid ${isSelected ? "#C8E7D6" : isDropped ? "#F8B4B4" : "#E5E1D5"}`,
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                    <span style={{
                      fontWeight: 700,
                      color: isSelected ? "#2F6B4F" : isDropped ? "#B14D4D" : "#5B5648",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}>
                      {isSelected ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                      {isSelected ? "Selected / Allocated" : isDropped ? "Offer Released / Dropped" : "Allocation Decision: Not Selected"}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#5B5648" }}>
                      Rank #{alloc.rank} · {alloc.pct}% match
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: "#3A3730", lineHeight: 1.4 }}>
                    <strong style={{ color: "#1B2A4A" }}>Why this decision?</strong> {alloc.reason}
                  </div>
                </div>
              )}

              {isOpen && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #F0EEE6" }}>
                  <div style={{ fontSize: 13.5, color: "#3A3730", marginBottom: 10 }}>{match.explanation}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: match.missingSkills.length ? 12 : 0 }}>
                    {match.matchedSkills.map((s) => <Chip key={s} tone="matched">✓ {s}</Chip>)}
                  </div>
                  {match.missingSkills.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "#9A5B12", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                        <Info size={13} /> Skill gaps &amp; next steps
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {match.missingSkills.map((s) => <Chip key={s} tone="missing">Learn: {s}</Chip>)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
