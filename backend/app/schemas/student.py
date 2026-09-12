from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
from datetime import datetime

class StudentCreate(BaseModel):
    name: str
    email: str
    mobile: str
    college: str
    skills: Union[List[str], str]
    interests: Union[List[str], str]
    preferred_domain: str
    projects: str
    resume_metadata: Optional[Dict[str, Any]] = None

class StudentResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    email: str
    mobile: str
    college: str
    skills: List[str]
    interests: List[str]
    preferred_domain: str
    projects: str
    resume_metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
