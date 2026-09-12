import React, { useState, useMemo, useEffect, useRef } from "react";
import { Header } from "./components/Header.jsx";
import { StudentView } from "./pages/StudentView.jsx";
import { RecruiterView } from "./pages/RecruiterView.jsx";
import { AdminView } from "./pages/AdminView.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";

import { seedStudents } from "./data/seedStudents.js";
import { seedOpportunities } from "./data/seedOpportunities.js";
import { DOMAINS } from "./data/constants.js";
import { computeMatch } from "./utils/matching.js";
import { validateOpportunityForm } from "./utils/validation.js";
import { api } from "./services/api.js";

export default function App() {
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [view, setView] = useState("student");
  const [students, setStudents] = useState(seedStudents);
  const [opportunities, setOpportunities] = useState(seedOpportunities);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [expanded, setExpanded] = useState(new Set());
  const [allocations, setAllocations] = useState([]);
  const [selectedOppId, setSelectedOppId] = useState(seedOpportunities[0]?.id || "o1");

  const [appliedOppIds, setAppliedOppIds] = useState(new Set());
  const [applyingOppId, setApplyingOppId] = useState(null);

  const opportunitiesRef = useRef(opportunities);
  const allocationsRef = useRef(allocations);
  const studentsRef = useRef(students);

  useEffect(() => {
    opportunitiesRef.current = opportunities;
  }, [opportunities]);

  useEffect(() => {
    allocationsRef.current = allocations;
  }, [allocations]);

  useEffect(() => {
    studentsRef.current = students;
  }, [students]);

  // Check auth session on startup
  useEffect(() => {
    async function checkAuth() {
      try {
        const currentUser = await api.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        console.warn("Auth session check failed:", err);
      } finally {
        setLoadingAuth(false);
      }
    }
    checkAuth();
  }, []);

  // Sync backend opportunities on mount
  useEffect(() => {
    async function loadBackendOpportunities() {
      const beOpps = await api.getOpportunities();
      if (beOpps && Array.isArray(beOpps) && beOpps.length > 0) {
        const mappedBE = beOpps.map(o => ({
          id: String(o.id),
          numericId: o.id,
          title: o.title,
          org: o.org,
          domain: o.domain,
          location: o.location,
          stipend: o.stipend,
          requiredSkills: Array.isArray(o.required_skills) ? o.required_skills : [],
          description: o.description,
          seatsTotal: o.seats_total,
          seatsFilled: o.seats_filled || 0
        }));
        setOpportunities(mappedBE);
        if (mappedBE.length > 0) {
          setSelectedOppId(String(mappedBE[0].id));
        }
      }
    }
    loadBackendOpportunities();
  }, []);

  // Sync backend students & current student applications when user logs in
  useEffect(() => {
    async function loadUserData() {
      const beStudents = await api.getStudents();
      if (beStudents && Array.isArray(beStudents) && beStudents.length > 0) {
        const mappedBE = beStudents.map(s => ({
          id: `be_${s.id}`,
          numericId: s.id,
          name: s.name,
          email: s.email,
          mobile: s.mobile,
          college: s.college,
          skills: Array.isArray(s.skills) ? s.skills : [],
          interests: Array.isArray(s.interests) ? s.interests : [],
          projects: s.projects,
          preferredDomain: s.preferred_domain,
          resume: s.resume_metadata
        }));
        setStudents(prev => {
          const existingIds = new Set(prev.map(p => String(p.id)));
          const toAdd = mappedBE.filter(b => !existingIds.has(String(b.id)));
          return [...prev, ...toAdd];
        });
      }

      if (user && user.role === "student") {
        const myProfile = await api.getMyStudentProfile();
        if (myProfile) {
          const profileId = `be_${myProfile.id}`;
          setCurrentStudentId(profileId);
        }

        const myApps = await api.getMyApplications();
        if (myApps && Array.isArray(myApps)) {
          const appSet = new Set(myApps.map(a => String(a.opportunity_id)));
          setAppliedOppIds(appSet);
        }
      }
    }
    loadUserData();
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.role === "admin") setView("admin");
    else if (userData.role === "recruiter") setView("recruiter");
    else setView("student");
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setAuthMode("login");
    setAppliedOppIds(new Set());
    setCurrentStudentId(null);
  };

  const currentStudent = students.find((s) => String(s.id) === String(currentStudentId));

  /* -------- profile form -------- */
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    college: "",
    skills: "",
    interests: "",
    projects: "",
    preferredDomain: DOMAINS[0]
  });

  async function submitProfile(e, resumeMetadata = null) {
    if (e && e.preventDefault) e.preventDefault();
    if (!form.name.trim()) return;

    const skillsList = typeof form.skills === 'string' 
      ? form.skills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : form.skills;
    const interestsList = typeof form.interests === 'string'
      ? form.interests.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : form.interests;

    const newStudentData = {
      name: form.name.trim(),
      email: (form.email || user?.email || "").trim(),
      mobile: form.mobile.trim(),
      college: form.college.trim(),
      skills: Array.from(new Set(skillsList)),
      interests: Array.from(new Set(interestsList)),
      preferred_domain: form.preferredDomain,
      projects: form.projects.trim(),
      resume_metadata: resumeMetadata
    };

    let createdId = "u_" + Date.now();

    try {
      const beResult = await api.createStudent(newStudentData);
      if (beResult && beResult.id) {
        createdId = `be_${beResult.id}`;
      }
    } catch (err) {
      console.warn("Backend save failed, using local profile state:", err.message);
      throw err;
    }

    const localStudentObj = {
      id: createdId,
      name: newStudentData.name,
      email: newStudentData.email,
      mobile: newStudentData.mobile,
      college: newStudentData.college,
      skills: newStudentData.skills,
      interests: newStudentData.interests,
      projects: newStudentData.projects,
      preferredDomain: newStudentData.preferred_domain,
      resume: resumeMetadata
    };

    setStudents((prev) => [...prev.filter(s => String(s.id) !== String(createdId)), localStudentObj]);
    setCurrentStudentId(createdId);
  }

  /* -------- opportunity form -------- */
  const [oppForm, setOppForm] = useState({ title: "", org: "", domain: DOMAINS[0], location: "", stipend: "", requiredSkills: "", description: "", seatsTotal: 2 });

  async function submitOpportunity(e) {
    if (e && e.preventDefault) e.preventDefault();

    const valErrors = validateOpportunityForm(oppForm);
    if (Object.keys(valErrors).length > 0) {
      throw new Error(Object.values(valErrors)[0]);
    }

    const skillsList = oppForm.requiredSkills.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

    const payload = {
      title: oppForm.title.trim(),
      org: oppForm.org.trim(),
      domain: oppForm.domain,
      location: oppForm.location.trim(),
      stipend: parseFloat(oppForm.stipend),
      required_skills: Array.from(new Set(skillsList)),
      description: oppForm.description.trim(),
      seats_total: parseInt(oppForm.seatsTotal, 10)
    };

    let newOpp;
    try {
      const beResult = await api.createOpportunity(payload);
      if (beResult && beResult.id) {
        newOpp = {
          id: String(beResult.id),
          numericId: beResult.id,
          title: beResult.title,
          org: beResult.org,
          domain: beResult.domain,
          location: beResult.location,
          stipend: beResult.stipend,
          requiredSkills: beResult.required_skills,
          description: beResult.description,
          seatsTotal: beResult.seats_total,
          seatsFilled: 0
        };
      }
    } catch (err) {
      console.warn("Backend opportunity save failed:", err.message);
      throw err;
    }

    if (!newOpp) {
      const id = "op_" + Date.now();
      newOpp = {
        id,
        title: oppForm.title.trim(),
        org: oppForm.org.trim(),
        domain: oppForm.domain,
        location: oppForm.location.trim(),
        stipend: parseFloat(oppForm.stipend),
        requiredSkills: Array.from(new Set(skillsList)),
        description: oppForm.description.trim(),
        seatsTotal: parseInt(oppForm.seatsTotal, 10),
        seatsFilled: 0,
      };
    }

    setOpportunities((prev) => [newOpp, ...prev]);
    setSelectedOppId(newOpp.id);
    setOppForm({ title: "", org: "", domain: DOMAINS[0], location: "", stipend: "", requiredSkills: "", description: "", seatsTotal: 2 });
  }

  /* -------- Handle Apply Now -------- */
  async function handleApplyOpportunity(oppId) {
    const opp = opportunities.find((o) => String(o.id) === String(oppId));
    if (!opp) return;

    let numericId = opp.numericId || parseInt(opp.id, 10);
    if (isNaN(numericId)) {
      const beOpps = await api.getOpportunities();
      const match = beOpps?.find(o => o.title === opp.title && o.org === opp.org);
      if (match) numericId = match.id;
      else numericId = 1;
    }

    setApplyingOppId(oppId);
    try {
      await api.applyOpportunity(numericId);
      setAppliedOppIds((prev) => new Set([...prev, String(oppId), String(numericId)]));
    } catch (err) {
      alert(err.message || "Failed to submit application.");
    } finally {
      setApplyingOppId(null);
    }
  }

  /* -------- Handle Remove Opportunity -------- */
  async function handleRemoveOpportunity(oppId) {
    const opp = opportunities.find((o) => String(o.id) === String(oppId) || (o.numericId && String(o.numericId) === String(oppId)));
    if (!opp) return;

    let numericId = opp.numericId || parseInt(opp.id, 10);
    if (isNaN(numericId)) {
      const beOpps = await api.getOpportunities();
      const match = beOpps?.find(o => o.title === opp.title && o.org === opp.org);
      if (match) numericId = match.id;
    }

    try {
      if (!isNaN(numericId)) {
        await api.deleteOpportunity(numericId);
      }
      setOpportunities((prev) => {
        const next = prev.filter((o) => String(o.id) !== String(oppId) && String(o.id) !== String(numericId));
        if (selectedOppId === oppId && next.length > 0) {
          setSelectedOppId(String(next[0].id));
        }
        return next;
      });
      setAllocations((prev) => prev.filter((a) => String(a.oppId) !== String(oppId) && String(a.oppId) !== String(numericId)));
    } catch (err) {
      alert(err.message || "Failed to remove posting.");
      throw err;
    }
  }

  /* -------- semantic recommendations for current student -------- */
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);
  const [recsError, setRecsError] = useState(null);

  // Triggered whenever currentStudent changes (login, profile submit, student switch)
  useEffect(() => {
    if (!currentStudent || !user || user.role !== "student") {
      setRecommendations([]);
      setRecsError(null);
      return;
    }

    // Only use backend semantic API for real authenticated students (be_ prefix)
    const isRealStudent = String(currentStudent.id).startsWith("be_");
    if (!isRealStudent) {
      // Seed/demo preview student — fall back to local bag-of-words
      const localRecs = opportunities
        .map((opp) => ({ opp, match: computeMatch(currentStudent, opp) }))
        .sort((a, b) => b.match.pct - a.match.pct);
      setRecommendations(localRecs);
      setRecsError(null);
      return;
    }

    let cancelled = false;
    async function fetchSemanticRecs() {
      setRecsLoading(true);
      setRecsError(null);
      try {
        const results = await api.getSemanticRecommendations();
        if (cancelled) return;

        // results is an array of { opportunity_id, pct, matchedSkills, missingSkills, explanation, breakdown }
        // Map back to { opp, match } shape that StudentView expects
        const oppMap = {};
        opportunities.forEach(o => { oppMap[String(o.id)] = o; oppMap[String(o.numericId)] = o; });

        const mapped = results
          .map(r => {
            const opp = oppMap[String(r.opportunity_id)];
            if (!opp) return null;
            return {
              opp,
              match: {
                pct: r.pct,
                matchedSkills: r.matchedSkills || [],
                missingSkills: r.missingSkills || [],
                explanation: r.explanation || `${r.pct}% semantic match.`,
                breakdown: r.breakdown || null,
              },
            };
          })
          .filter(Boolean);

        setRecommendations(mapped);
      } catch (err) {
        if (cancelled) return;
        // Do NOT silently fall back — surface the error clearly
        setRecsError(err.message || "Semantic matching failed. Please try again.");
        setRecommendations([]);
      } finally {
        if (!cancelled) setRecsLoading(false);
      }
    }

    fetchSemanticRecs();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStudent?.id, opportunities.length, user]);

  /* -------- ranked candidates for selected opportunity (Semantic) -------- */
  const selectedOpp = opportunities.find((o) => String(o.id) === String(selectedOppId));
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const candidateCacheRef = useRef(new Map());

  useEffect(() => {
    if (!user || (user.role !== "recruiter" && user.role !== "admin")) {
      setRankedCandidates([]);
      return;
    }
    if (!selectedOpp || !students || students.length === 0) {
      setRankedCandidates([]);
      return;
    }

    const oppKey = String(selectedOpp.id);
    if (candidateCacheRef.current.has(oppKey)) {
      setRankedCandidates(candidateCacheRef.current.get(oppKey));
    }

    let cancelled = false;
    async function fetchRanked() {
      try {
        const results = await api.getSemanticCandidates(selectedOpp, students);
        if (cancelled) return;
        const resultMap = new Map(results.map((r) => [String(r.studentId || r.student_id), r]));
        const list = students
          .map((st) => {
            const m = resultMap.get(String(st.id)) || resultMap.get(String(st.numericId));
            return {
              student: st,
              match: m ? {
                pct: m.pct,
                matchedSkills: m.matchedSkills || [],
                missingSkills: m.missingSkills || [],
                explanation: m.explanation || `${m.pct}% semantic match.`,
                breakdown: m.breakdown || null,
              } : null,
            };
          })
          .filter((item) => item.match != null)
          .sort((a, b) => b.match.pct - a.match.pct);

        candidateCacheRef.current.set(oppKey, list);
        setRankedCandidates(list);
      } catch (err) {
        console.error("Failed to load semantic candidate ranking:", err);
      }
    }

    fetchRanked();
    return () => { cancelled = true; };
  }, [selectedOpp?.id, students]);

  /* -------- fair allocation algorithm (Semantic Matching) -------- */
  async function runAllocation(oppId, rehealedCandidateName = null) {
    const oppList = opportunitiesRef.current;
    const allocList = allocationsRef.current;
    const studentList = studentsRef.current;

    const opp = oppList.find((o) => String(o.id) === String(oppId) || (o.numericId && String(o.numericId) === String(oppId)));
    if (!opp) return;
    const openSeats = opp.seatsTotal - opp.seatsFilled;
    if (openSeats <= 0) return;

    // Active allocations and dropped candidates for this opportunity
    const activeAllocations = allocList.filter(
      (a) => (String(a.oppId) === String(opp.id) || (opp.numericId && String(a.oppId) === String(opp.numericId))) && a.status === "allocated"
    );
    const activeAllocatedIds = new Set(activeAllocations.map((a) => String(a.studentId)));

    const droppedEntries = allocList.filter(
      (a) => (String(a.oppId) === String(opp.id) || (opp.numericId && String(a.oppId) === String(opp.numericId))) && a.status === "dropped"
    );
    const droppedIds = new Set(droppedEntries.map((a) => String(a.studentId)));

    // Candidates not already actively allocated or dropped
    const eligibleStudents = studentList.filter(
      (st) => !activeAllocatedIds.has(String(st.id)) && !droppedIds.has(String(st.id))
    );
    if (eligibleStudents.length === 0) return;

    // Fetch real semantic scores for all eligible candidates from backend matching service
    let results = [];
    try {
      results = await api.getSemanticCandidates(opp, eligibleStudents);
    } catch (err) {
      console.error("Semantic candidate scoring failed in runAllocation:", err);
      return;
    }

    const resultMap = new Map(results.map((r) => [String(r.studentId || r.student_id), r]));
    const ranked = eligibleStudents
      .map((st) => {
        const m = resultMap.get(String(st.id)) || resultMap.get(String(st.numericId));
        return {
          student: st,
          match: m ? {
            pct: m.pct,
            matchedSkills: m.matchedSkills || [],
            missingSkills: m.missingSkills || [],
            explanation: m.explanation || `${m.pct}% semantic match.`,
            breakdown: m.breakdown || null,
          } : null,
        };
      })
      .filter((item) => item.match != null)
      .sort((a, b) => b.match.pct - a.match.pct);

    const collegeCap = Math.max(1, Math.ceil(opp.seatsTotal * 0.6));
    const collegeCount = {};
    activeAllocations.forEach((a) => {
      const st = studentList.find((s) => String(s.id) === String(a.studentId) || (s.numericId && String(s.numericId) === String(a.studentId)));
      if (st) collegeCount[st.college] = (collegeCount[st.college] || 0) + 1;
    });

    const newEntries = [];
    let seatsLeft = openSeats;
    let rank = activeAllocatedIds.size + 1;

    for (const { student, match } of ranked) {
      const skillsStr = match.matchedSkills && match.matchedSkills.length > 0 ? ` (${match.matchedSkills.join(", ")})` : "";

      if (seatsLeft > 0) {
        const count = collegeCount[student.college] || 0;
        if (count >= collegeCap) {
          newEntries.push({
            id: "log_" + Date.now() + "_" + student.id + "_" + Math.random().toString(36).substr(2, 4),
            studentId: student.id,
            oppId: opp.id,
            pct: match.pct,
            status: "skipped_fairness",
            reason: `Not selected — Rank #${rank}. ${match.pct}% match. Skipped due to institutional diversity cap: maximum ${collegeCap} seat${collegeCap > 1 ? "s" : ""} per college.`,
            rank,
            ts: Date.now(),
          });
          rank++;
          continue;
        }

        const rehealPrefix = rehealedCandidateName ? `Seat released → reallocated to ${student.name}. ` : "";
        newEntries.push({
          id: "log_" + Date.now() + "_" + student.id + "_" + Math.random().toString(36).substr(2, 4),
          studentId: student.id,
          oppId: opp.id,
          pct: match.pct,
          status: "allocated",
          reason: `${rehealPrefix}Selected — Rank #${rank}. ${match.pct}% match based on relevant skills${skillsStr}, project similarity and domain preference. You met all eligibility constraints and a seat was available.`,
          rank,
          ts: Date.now(),
          isReheal: Boolean(rehealedCandidateName),
        });
        collegeCount[student.college] = count + 1;
        seatsLeft--;
        rank++;
      } else {
        newEntries.push({
          id: "log_" + Date.now() + "_" + student.id + "_" + Math.random().toString(36).substr(2, 4),
          studentId: student.id,
          oppId: opp.id,
          pct: match.pct,
          status: "not_selected",
          reason: `Not selected — Rank #${rank}. ${match.pct}% match. Eligible, but all ${opp.seatsTotal} available seats were filled by higher-ranked candidates.`,
          rank,
          ts: Date.now(),
        });
        rank++;
      }
    }

    setAllocations((prev) => {
      const newStudentIds = new Set(newEntries.map((e) => String(e.studentId)));
      const filteredPrev = prev.filter((a) => {
        const isThisOpp = String(a.oppId) === String(opp.id) || (opp.numericId && String(a.oppId) === String(opp.numericId));
        if (!isThisOpp) return true;
        if (a.status === "dropped") return true;
        return !newStudentIds.has(String(a.studentId));
      });
      return [...filteredPrev, ...newEntries];
    });

    const newlyFilled = openSeats - seatsLeft;
    setOpportunities((prev) =>
      prev.map((o) =>
        String(o.id) === String(opp.id) || (o.numericId && String(o.numericId) === String(opp.numericId))
          ? { ...o, seatsFilled: o.seatsFilled + newlyFilled }
          : o
      )
    );
  }

  async function simulateDropout(entry) {
    const oppList = opportunitiesRef.current;
    const studentList = studentsRef.current;
    const droppedStudent = studentList.find(
      (s) => String(s.id) === String(entry.studentId) || (s.numericId && String(s.numericId) === String(entry.studentId))
    );
    const opp = oppList.find(
      (o) => String(o.id) === String(entry.oppId) || (o.numericId && String(o.numericId) === String(entry.oppId))
    );

    const updatedAllocations = allocationsRef.current.map((a) =>
      a.id === entry.id
        ? {
            ...a,
            status: "dropped",
            reason: `Dropped — offer released. Seat freed up for ${opp?.title || "opportunity"}.`,
            ts: Date.now(),
          }
        : a
    );
    allocationsRef.current = updatedAllocations;
    setAllocations(updatedAllocations);

    const updatedOpps = opportunitiesRef.current.map((o) =>
      String(o.id) === String(entry.oppId) || (o.numericId && String(o.numericId) === String(entry.oppId))
        ? { ...o, seatsFilled: Math.max(0, o.seatsFilled - 1) }
        : o
    );
    opportunitiesRef.current = updatedOpps;
    setOpportunities(updatedOpps);

    await runAllocation(entry.oppId, droppedStudent?.name || "candidate");
  }

  function toggleExpand(id) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const totalSeats = opportunities.reduce((s, o) => s + (o.seatsTotal || 0), 0);
  const filledSeats = opportunities.reduce((s, o) => s + (o.seatsFilled || 0), 0);

  if (loadingAuth) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <div>Loading SAMARTH AI Platform...</div>
      </div>
    );
  }

  // Auth Protection Wall
  if (!user) {
    return (
      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#FAF8F4", minHeight: "100vh", padding: "20px" }}>
        {authMode === "login" ? (
          <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setAuthMode("register")} />
        ) : (
          <RegisterPage onRegisterSuccess={handleLoginSuccess} onSwitchToLogin={() => setAuthMode("login")} />
        )}
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#FAF8F4", minHeight: "100vh", color: "#1A1A1A" }}>
      <Header view={view} setView={setView} user={user} onLogout={handleLogout} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 60px" }}>
        {view === "student" && (
          <StudentView
            currentStudent={currentStudent}
            students={students}
            setCurrentStudentId={setCurrentStudentId}
            form={form}
            setForm={setForm}
            submitProfile={submitProfile}
            recommendations={recommendations}
            recsLoading={recsLoading}
            recsError={recsError}
            expanded={expanded}
            toggleExpand={toggleExpand}
            appliedOppIds={appliedOppIds}
            onApply={handleApplyOpportunity}
            applyingOppId={applyingOppId}
            user={user}
            allocations={allocations}
          />
        )}
        {view === "recruiter" && (
          <RecruiterView
            opportunities={opportunities}
            oppForm={oppForm}
            setOppForm={setOppForm}
            submitOpportunity={submitOpportunity}
            selectedOppId={selectedOppId}
            setSelectedOppId={setSelectedOppId}
            selectedOpp={selectedOpp}
            rankedCandidates={rankedCandidates}
            runAllocation={runAllocation}
            allocations={allocations}
            onRemoveOpportunity={handleRemoveOpportunity}
          />
        )}
        {view === "admin" && (
          <AdminView
            opportunities={opportunities}
            students={students}
            allocations={allocations}
            totalSeats={totalSeats}
            filledSeats={filledSeats}
            simulateDropout={simulateDropout}
          />
        )}
      </div>
    </div>
  );
}
