from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.opportunity import Opportunity
from app.models.user import User
from app.schemas.opportunity import OpportunityCreate, OpportunityResponse
from app.utils.validation import validate_opportunity_data
from app.utils.security import get_current_user

router = APIRouter(prefix="/opportunities", tags=["Opportunities"])

@router.get("", response_model=List[OpportunityResponse])
def get_opportunities(db: Session = Depends(get_db)):
    return db.query(Opportunity).filter(Opportunity.is_active == True).all()

@router.post("", response_model=OpportunityResponse, status_code=status.HTTP_201_CREATED)
def create_opportunity(
    opp_in: OpportunityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters and administrators can post opportunities."
        )

    raw_dict = opp_in.dict()
    errors = validate_opportunity_data(raw_dict)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"validation_errors": errors}
        )

    req_skills = opp_in.required_skills
    if isinstance(req_skills, str):
        skills_list = list(dict.fromkeys([s.strip().lower() for s in req_skills.split(",") if s.strip()]))
    else:
        skills_list = list(dict.fromkeys([str(s).strip().lower() for s in req_skills if str(s).strip()]))

    opportunity = Opportunity(
        recruiter_id=current_user.id,
        title=opp_in.title.strip(),
        org=opp_in.org.strip(),
        domain=opp_in.domain,
        location=opp_in.location.strip(),
        stipend=float(opp_in.stipend),
        required_skills=skills_list,
        description=opp_in.description.strip(),
        seats_total=int(opp_in.seats_total),
        seats_filled=0,
        is_active=True
    )

    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)
    return opportunity

@router.delete("/{opportunity_id}")
def delete_opportunity(
    opportunity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters and administrators can remove opportunities."
        )

    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    if not opportunity or not opportunity.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity not found or already removed."
        )

    # Recruiters can only delete their own postings unless admin
    if current_user.role != "admin" and opportunity.recruiter_id and opportunity.recruiter_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to remove another recruiter's posting."
        )

    opportunity.is_active = False
    db.commit()
    return {"message": "Posting removed successfully."}
