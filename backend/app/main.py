import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User, Student, Opportunity, Application
from app.api import health_router, auth_router, students_router, opportunities_router, applications_router, matching_router
from app.services.seed_service import seed_database

# Create database tables automatically
Base.metadata.create_all(bind=engine)

# Seed initial database idempotently
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title="SAMARTH AI Backend API",
    description="Backend services for explainable, fair internship matching & allocation",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(students_router, prefix="/api")
app.include_router(opportunities_router, prefix="/api")
app.include_router(applications_router, prefix="/api")
app.include_router(matching_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Welcome to SAMARTH AI API. Visit /docs for API documentation."}
