from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ApplicationCreate(BaseModel):
    opportunity_id: int

class ApplicationResponse(BaseModel):
    id: int
    student_id: int
    opportunity_id: int
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
