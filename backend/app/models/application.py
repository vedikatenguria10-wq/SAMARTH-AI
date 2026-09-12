from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id"), nullable=False)
    status = Column(String(50), nullable=False, default="pending") # "pending", "allocated", "rejected"
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="applications")
    opportunity = relationship("Opportunity", back_populates="applications")

    __table_args__ = (
        UniqueConstraint("student_id", "opportunity_id", name="uix_student_opportunity"),
    )
