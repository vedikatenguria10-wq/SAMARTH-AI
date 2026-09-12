from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    mobile = Column(String(20), nullable=False)
    college = Column(String(150), nullable=False)
    skills = Column(JSON, nullable=False) # stored as JSON list of strings
    interests = Column(JSON, nullable=False) # stored as JSON list of strings
    preferred_domain = Column(String(50), nullable=False)
    projects = Column(Text, nullable=False)
    resume_metadata = Column(JSON, nullable=True) # { filename, size, type, uploaded_at }
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="student_profile")
    applications = relationship("Application", back_populates="student")
