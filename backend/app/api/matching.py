"""
POST /api/matching/recommendations

Authenticated student endpoint — returns semantic ranked recommendations.
Does NOT write to the database.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.student import Student
from app.models.opportunity import Opportunity
from app.models.user import User
from app.utils.security import get_current_user
from app.services.matching_service import batch_recommendations, batch_students_for_opportunity

router = APIRouter(prefix="/matching", tags=["Matching"])


@router.post("/recommendations")
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Compute semantic recommendations for the authenticated student.
    Requires the student to have a linked profile.
    Returns list sorted by match score descending.
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can request recommendations.",
        )

    # Load student profile linked to this user
    student_db = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found. Please complete your profile first.",
        )

    # Load all active opportunities
    opportunities_db = (
        db.query(Opportunity).filter(Opportunity.is_active == True).all()
    )

    if not opportunities_db:
        return []

    # Convert ORM objects to plain dicts for the matching service
    student_dict: Dict[str, Any] = {
        "id": student_db.id,
        "name": student_db.name,
        "skills": student_db.skills if isinstance(student_db.skills, list) else [],
        "interests": student_db.interests if isinstance(student_db.interests, list) else [],
        "preferred_domain": student_db.preferred_domain or "",
        "projects": student_db.projects or "",
    }

    opp_list: List[Dict[str, Any]] = [
        {
            "id": o.id,
            "title": o.title,
            "org": o.org,
            "domain": o.domain,
            "location": o.location,
            "stipend": float(o.stipend),
            "required_skills": o.required_skills if isinstance(o.required_skills, list) else [],
            "description": o.description or "",
            "seats_total": o.seats_total,
            "seats_filled": o.seats_filled,
        }
        for o in opportunities_db
    ]

    # Run semantic matching (may take a few seconds; acceptable for hackathon MVP)
    try:
        results = batch_recommendations(student_dict, opp_list)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Semantic matching model unavailable: {e}",
        )

    return results


@router.post("/candidates")
def get_candidate_matches(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Compute semantic matching scores for candidate students against an opportunity.
    Used by the allocation engine and candidate ranking.
    Accepts:
      - opportunity_id (int or str) and/or opportunity (dict)
      - students (optional list of student dicts). If not provided, loads students from DB.
    Returns list of candidate matches sorted descending by pct.
    """
    opp_dict = payload.get("opportunity")
    opp_id = payload.get("opportunity_id")

    if not opp_dict and opp_id is not None:
        try:
            numeric_id = int(opp_id)
            opp_db = db.query(Opportunity).filter(Opportunity.id == numeric_id).first()
            if opp_db:
                opp_dict = {
                    "id": opp_db.id,
                    "title": opp_db.title,
                    "org": opp_db.org,
                    "domain": opp_db.domain,
                    "location": opp_db.location,
                    "stipend": float(opp_db.stipend),
                    "required_skills": opp_db.required_skills if isinstance(opp_db.required_skills, list) else [],
                    "description": opp_db.description or "",
                    "seats_total": opp_db.seats_total,
                    "seats_filled": opp_db.seats_filled,
                }
        except (ValueError, TypeError):
            pass

    if not opp_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Opportunity not provided or not found in database.",
        )

    students_list = payload.get("students")
    if not students_list:
        students_db = db.query(Student).all()
        students_list = [
            {
                "id": s.id,
                "name": s.name,
                "college": s.college,
                "skills": s.skills if isinstance(s.skills, list) else [],
                "interests": s.interests if isinstance(s.interests, list) else [],
                "preferred_domain": s.preferred_domain or "",
                "projects": s.projects or "",
            }
            for s in students_db
        ]

    try:
        results = batch_students_for_opportunity(opp_dict, students_list)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Semantic matching model unavailable: {e}",
        )

    return results
