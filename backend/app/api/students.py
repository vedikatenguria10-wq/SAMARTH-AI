from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.database import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentCreate, StudentResponse
from app.utils.validation import validate_student_data
from app.utils.security import get_current_user
from jose import jwt, JWTError
from app.config import settings

router = APIRouter(prefix="/students", tags=["Students"])
optional_security = HTTPBearer(auto_error=False)

def get_optional_user(db: Session = Depends(get_db), credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security)) -> Optional[User]:
    if not credentials or not credentials.credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email:
            return db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()
    except Exception:
        pass
    return None

@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student_in: StudentCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    raw_dict = student_in.dict()
    errors = validate_student_data(raw_dict)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"validation_errors": errors}
        )

    # Process skills and interests lists
    skills = student_in.skills
    if isinstance(skills, str):
        skills_list = list(dict.fromkeys([s.strip().lower() for s in skills.split(",") if s.strip()]))
    else:
        skills_list = list(dict.fromkeys([str(s).strip().lower() for s in skills if str(s).strip()]))

    interests = student_in.interests
    if isinstance(interests, str):
        interests_list = list(dict.fromkeys([i.strip().lower() for i in interests.split(",") if i.strip()]))
    else:
        interests_list = list(dict.fromkeys([str(i).strip().lower() for i in interests if str(i).strip()]))

    # Check if student profile already exists for this user or email
    user_id = current_user.id if current_user else None
    existing_profile = None
    if user_id:
        existing_profile = db.query(Student).filter(Student.user_id == user_id).first()
    if not existing_profile:
        existing_profile = db.query(Student).filter(func.lower(Student.email) == student_in.email.strip().lower()).first()

    if existing_profile:
        # Update existing profile and link user_id if present
        if user_id and not existing_profile.user_id:
            existing_profile.user_id = user_id
        existing_profile.name = student_in.name.strip()
        existing_profile.email = student_in.email.strip().lower()
        existing_profile.mobile = student_in.mobile.strip()
        existing_profile.college = student_in.college.strip()
        existing_profile.skills = skills_list
        existing_profile.interests = interests_list
        existing_profile.preferred_domain = student_in.preferred_domain
        existing_profile.projects = student_in.projects.strip()
        existing_profile.resume_metadata = student_in.resume_metadata
        db.commit()
        db.refresh(existing_profile)
        return existing_profile
    else:
        student = Student(
            user_id=user_id,
            name=student_in.name.strip(),
            email=student_in.email.strip().lower(),
            mobile=student_in.mobile.strip(),
            college=student_in.college.strip(),
            skills=skills_list,
            interests=interests_list,
            preferred_domain=student_in.preferred_domain,
            projects=student_in.projects.strip(),
            resume_metadata=student_in.resume_metadata
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        return student

@router.get("/me", response_model=StudentResponse)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        # Fallback query by email if user_id wasn't linked yet
        student = db.query(Student).filter(func.lower(Student.email) == current_user.email.strip().lower()).first()
        if student and not student.user_id:
            student.user_id = current_user.id
            db.commit()
            db.refresh(student)
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found for this user."
        )
    return student

@router.get("", response_model=List[StudentResponse])
def get_students(db: Session = Depends(get_db)):
    return db.query(Student).all()

@router.get("/{student_id}", response_model=StudentResponse)
def get_student_by_id(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    return student
