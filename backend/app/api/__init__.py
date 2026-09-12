from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.students import router as students_router
from app.api.opportunities import router as opportunities_router
from app.api.applications import router as applications_router

__all__ = ["health_router", "auth_router", "students_router", "opportunities_router", "applications_router"]
