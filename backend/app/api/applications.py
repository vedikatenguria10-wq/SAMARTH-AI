from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.application import Application
from app.models.opportunity import Opportunity
from app.models.student import Student
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationResponse
from app.utils.security import get_current_user

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_opportunity(
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can apply for internships."
        )

    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please create and complete your student profile before applying."
        )

    opportunity = db.query(Opportunity).filter(
        Opportunity.id == app_in.opportunity_id,
        Opportunity.is_active == True
    ).first()

    if not opportunity:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Opportunity is inactive or no longer available."
        )

    if opportunity.seats_filled >= opportunity.seats_total:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No seats available for this internship."
        )

    # Check for duplicate application
    existing = db.query(Application).filter(
        Application.student_id == student.id,
        Application.opportunity_id == opportunity.id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied for this internship."
        )

    # Create PENDING application without deducting seats
    new_app = Application(
        student_id=student.id,
        opportunity_id=opportunity.id,
        status="pending"
    )

    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    return new_app

@router.get("/me", response_model=List[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        return []
    return db.query(Application).filter(Application.student_id == student.id).all()

@router.get("", response_model=List[ApplicationResponse])
def get_all_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["recruiter", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view all applications."
        )
    return db.query(Application).all()
