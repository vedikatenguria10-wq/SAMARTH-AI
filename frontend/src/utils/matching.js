/* ---------------------------------------------------------------------- */
/* MATCHING ENGINE — bag-of-words cosine similarity + skill-overlap score  */
/* Isolated module ready for future Sentence Transformer replacement      */
/* ---------------------------------------------------------------------- */

const STOPWORDS = new Set(["a","an","the","and","or","to","of","in","for","with","on","is","are","this","that"]);

function tokenize(text) {
  return (text || "")
    .toLowerCase()
    .split(/[^a-z0-9+.#]+/)
    .filter((t) => t && !STOPWORDS.has(t));
}

function termFreq(tokens) {
  const map = {};
  tokens.forEach((t) => { map[t] = (map[t] || 0) + 1; });
  return map;
}

function cosineSim(textA, textB) {
  const a = termFreq(tokenize(textA));
  const b = termFreq(tokenize(textB));
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, normA = 0, normB = 0;
  keys.forEach((k) => {
    const av = a[k] || 0, bv = b[k] || 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  });
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function studentProfileText(student) {
  return [
    ...(student.skills || []),
    ...(student.interests || []),
    student.projects || "",
    student.preferredDomain || student.preferred_domain || "",
  ].join(" ");
}

function opportunityText(opp) {
  return [...(opp.requiredSkills || []), opp.description || "", opp.domain || ""].join(" ");
}

export function computeMatch(student, opp) {
  const studentSkillsLower = (student.skills || []).map((s) => s.toLowerCase().trim());
  const required = opp.requiredSkills || [];
  const matchedSkills = required.filter((s) => studentSkillsLower.includes(s.toLowerCase().trim()));
  const missingSkills = required.filter((s) => !studentSkillsLower.includes(s.toLowerCase().trim()));

  const skillScore = required.length ? matchedSkills.length / required.length : 0.5;
  const textScore = cosineSim(studentProfileText(student), opportunityText(opp));
  const domain = student.preferredDomain || student.preferred_domain;
  const domainBonus = domain && domain === opp.domain ? 0.06 : 0;

  let score = skillScore * 0.62 + textScore * 0.32 + domainBonus;
  score = Math.max(0, Math.min(1, score));
  const pct = Math.round(score * 100);

  let explanation;
  if (matchedSkills.length === required.length && required.length > 0) {
    explanation = `Strong match — your profile covers all ${required.length} required skills, and your project/interest description closely aligns with this role's focus on ${opp.domain}.`;
  } else if (matchedSkills.length > 0) {
    explanation = `Partial match — you have ${matchedSkills.length} of ${required.length} required skills (${matchedSkills.join(", ")}). Profile similarity to the role description contributed the rest of the score.`;
  } else {
    explanation = `Low overlap on listed required skills, though there may be some relevance from your interests or project background.`;
  }

  return { pct, matchedSkills, missingSkills, explanation };
}
