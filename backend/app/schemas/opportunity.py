from pydantic import BaseModel
from typing import List, Optional, Union
from datetime import datetime

class OpportunityCreate(BaseModel):
    title: str
    org: str
    domain: str
    location: str
    stipend: Union[float, int]
    required_skills: Union[List[str], str]
    description: str
    seats_total: int

class OpportunityResponse(BaseModel):
    id: int
    recruiter_id: Optional[int] = None
    title: str
    org: str
    domain: str
    location: str
    stipend: float
    required_skills: List[str]
    description: str
    seats_total: int
    seats_filled: int
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
