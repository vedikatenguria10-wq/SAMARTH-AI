from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    recruiter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(150), nullable=False)
    org = Column(String(150), nullable=False)
    domain = Column(String(50), nullable=False)
    location = Column(String(100), nullable=False)
    stipend = Column(Float, nullable=False, default=0.0) # strictly numeric stipend >= 0
    required_skills = Column(JSON, nullable=False) # JSON list of string skills
    description = Column(Text, nullable=False)
    seats_total = Column(Integer, nullable=False, default=1)
    seats_filled = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, nullable=False, default=True) # for soft deletion
    created_at = Column(DateTime, default=datetime.utcnow)

    recruiter = relationship("User")
    applications = relationship("Application", back_populates="opportunity")
