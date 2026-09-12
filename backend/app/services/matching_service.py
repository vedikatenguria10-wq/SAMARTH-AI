"""
SAMARTH AI — Semantic Matching Service
Uses SentenceTransformer all-MiniLM-L6-v2 for real semantic similarity.
Model is loaded ONCE at module level.

Scoring formula (total = 100 points):
  Skill Fit         : 50 pts  (semantic skill similarity)
  Project Relevance : 20 pts  (student projects vs opp title + description)
  Interest Relevance: 20 pts  (student interests + preferred_domain vs opp domain + title + description)
  Preferred Domain  : 10 pts  (exact normalised domain match)
"""

import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

import math
import threading
from typing import List, Dict, Any

import torch
torch.set_num_threads(1)

from sentence_transformers import SentenceTransformer
from sentence_transformers.util import cos_sim

# Process-level lock to strictly serialize inference on the shared model
_inference_lock = threading.RLock()

# ---------------------------------------------------------------------------
# Load model ONCE at module level — not per-request
# ---------------------------------------------------------------------------
_MODEL_NAME = "all-MiniLM-L6-v2"
try:
    _model = SentenceTransformer(_MODEL_NAME)
except Exception as e:
    import warnings
    warnings.warn(f"[matching_service] Failed to load SentenceTransformer '{_MODEL_NAME}': {e}")
    _model = None


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _encode(texts: List[str]):
    """Encode a list of strings and return normalised embeddings."""
    if _model is None:
        raise RuntimeError("SentenceTransformer model is not loaded.")
    with _inference_lock:
        with torch.no_grad():
            return _model.encode(texts, convert_to_tensor=True, normalize_embeddings=True)


def _cosine(emb_a, emb_b) -> float:
    """Return cosine similarity clamped to [0, 1]."""
    sim = float(cos_sim(emb_a, emb_b))
    return max(0.0, min(1.0, sim))


SKILL_MATCH_THRESHOLD = 0.60   # semantic similarity above this → matched


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compute_semantic_match(student: Dict[str, Any], opportunity: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compute a semantic match between one student and one opportunity.

    Parameters
    ----------
    student : dict with keys  name, skills (list), interests (list),
                               preferred_domain, projects
    opportunity : dict with keys  id, title, org, domain, description,
                                   required_skills (list)

    Returns
    -------
    dict  with keys:
        opportunity_id, pct, matchedSkills, missingSkills,
        explanation, breakdown
    """
    if _model is None:
        raise RuntimeError("Semantic model unavailable.")

    student_skills: List[str] = student.get("skills") or []
    required_skills: List[str] = opportunity.get("required_skills") or opportunity.get("requiredSkills") or []
    student_projects: str = (student.get("projects") or "").strip()
    student_interests: List[str] = student.get("interests") or []
    student_domain: str = (student.get("preferred_domain") or student.get("preferredDomain") or "").strip()

    opp_title: str = (opportunity.get("title") or "").strip()
    opp_domain: str = (opportunity.get("domain") or "").strip()
    opp_description: str = (opportunity.get("description") or "").strip()

    # ------------------------------------------------------------------
    # 1. SKILL FIT  (0–50 pts)
    # ------------------------------------------------------------------
    skill_score_raw = 0.0
    matched_skills: List[str] = []
    missing_skills: List[str] = []

    if required_skills and student_skills:
        # Encode all skills in a single batch for efficiency
        all_texts = student_skills + required_skills
        all_embs = _encode(all_texts)
        student_embs = all_embs[: len(student_skills)]
        required_embs = all_embs[len(student_skills):]

        total_best_sim = 0.0
        for r_idx, req_skill in enumerate(required_skills):
            best_sim = 0.0
            for s_idx in range(len(student_skills)):
                sim = _cosine(student_embs[s_idx], required_embs[r_idx])
                if sim > best_sim:
                    best_sim = sim
            total_best_sim += best_sim
            if best_sim >= SKILL_MATCH_THRESHOLD:
                matched_skills.append(req_skill)
            else:
                missing_skills.append(req_skill)

        avg_best_sim = total_best_sim / len(required_skills)
        skill_score_raw = avg_best_sim  # 0–1
    elif not required_skills:
        # No requirements — neutral score, all student skills implicitly matched
        skill_score_raw = 0.7
    else:
        # Student has no skills, all required skills are missing
        missing_skills = list(required_skills)
        skill_score_raw = 0.0

    skill_fit = round(min(50.0, max(0.0, skill_score_raw * 50.0)), 2)

    # ------------------------------------------------------------------
    # 2. PROJECT RELEVANCE  (0–20 pts)
    # ------------------------------------------------------------------
    project_fit = 0.0
    if student_projects:
        opp_text_for_project = f"{opp_title} {opp_description}"
        proj_embs = _encode([student_projects, opp_text_for_project])
        project_sim = _cosine(proj_embs[0], proj_embs[1])
        project_fit = round(min(20.0, max(0.0, project_sim * 20.0)), 2)

    # ------------------------------------------------------------------
    # 3. INTEREST RELEVANCE  (0–20 pts)
    # ------------------------------------------------------------------
    interest_fit = 0.0
    student_interest_text = " ".join(student_interests + ([student_domain] if student_domain else []))
    if student_interest_text.strip():
        opp_text_for_interest = f"{opp_domain} {opp_title} {opp_description}"
        interest_embs = _encode([student_interest_text, opp_text_for_interest])
        interest_sim = _cosine(interest_embs[0], interest_embs[1])
        interest_fit = round(min(20.0, max(0.0, interest_sim * 20.0)), 2)

    # ------------------------------------------------------------------
    # 4. PREFERRED DOMAIN  (0 or 10 pts)
    # ------------------------------------------------------------------
    domain_fit = 0.0
    if student_domain and opp_domain:
        if student_domain.strip().lower() == opp_domain.strip().lower():
            domain_fit = 10.0

    # ------------------------------------------------------------------
    # 5. TOTAL
    # ------------------------------------------------------------------
    total = skill_fit + project_fit + interest_fit + domain_fit
    total = round(min(100.0, max(0.0, total)))

    # ------------------------------------------------------------------
    # 6. EXPLANATION
    # ------------------------------------------------------------------
    skill_label = _level_label(skill_fit, 50)
    project_label = _level_label(project_fit, 20)
    interest_label = _level_label(interest_fit, 20)

    parts = []
    if skill_fit >= 35:
        parts.append("strong semantic skill alignment")
    elif skill_fit >= 20:
        parts.append("moderate skill alignment")
    else:
        parts.append("limited skill overlap")

    if project_fit >= 12:
        parts.append("high project relevance")
    elif project_fit >= 6:
        parts.append("some project relevance")

    if interest_fit >= 12:
        parts.append("strong interest alignment")

    match_phrase = ", ".join(parts) if parts else "general profile similarity"
    explanation = f"{total}% match — {match_phrase}."

    if domain_fit == 10.0:
        explanation += " Your preferred domain also matches this opportunity."

    if missing_skills:
        gap_str = ", ".join(missing_skills[:3])
        if len(missing_skills) > 3:
            gap_str += f" +{len(missing_skills) - 3} more"
        explanation += f" Skill gap: {gap_str}."

    return {
        "opportunity_id": opportunity.get("id"),
        "opportunityId": opportunity.get("id"),
        "student_id": student.get("id"),
        "studentId": student.get("id"),
        "pct": int(total),
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "explanation": explanation,
        "breakdown": {
            "skill_fit": skill_fit,
            "project_fit": project_fit,
            "interest_fit": interest_fit,
            "domain_fit": domain_fit,
            "total": int(total),
        },
    }


def _level_label(score: float, max_score: float) -> str:
    pct = score / max_score if max_score else 0
    if pct >= 0.7:
        return "high"
    if pct >= 0.4:
        return "moderate"
    return "low"


def batch_recommendations(student: Dict[str, Any], opportunities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Calculate semantic matches for a student against all opportunities,
    sorted descending by pct. Encodes opportunity texts in a single batch pass.
    """
    if not opportunities:
        return []

    with _inference_lock:
        results = []
        for opp in opportunities:
            try:
                match = compute_semantic_match(student, opp)
                results.append(match)
            except Exception as e:
                # Skip bad records rather than failing the whole request
                import logging
                logging.getLogger(__name__).warning(f"Skipped opp {opp.get('id')}: {e}")

        results.sort(key=lambda r: r["pct"], reverse=True)
        return results


def batch_students_for_opportunity(opportunity: Dict[str, Any], students: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Calculate semantic matches for multiple candidate students against one opportunity.
    Used by the allocation engine and candidate ranking.
    Returns list sorted descending by pct.
    """
    if not students:
        return []

    with _inference_lock:
        results = []
        for st in students:
            try:
                match = compute_semantic_match(st, opportunity)
                results.append({
                    "student_id": st.get("id"),
                    "studentId": st.get("id"),
                    "opportunity_id": opportunity.get("id"),
                    "opportunityId": opportunity.get("id"),
                    "pct": match["pct"],
                    "matchedSkills": match["matchedSkills"],
                    "missingSkills": match["missingSkills"],
                    "explanation": match["explanation"],
                    "breakdown": match["breakdown"],
                })
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Skipped student {st.get('id')}: {e}")

        results.sort(key=lambda r: r["pct"], reverse=True)
        return results
