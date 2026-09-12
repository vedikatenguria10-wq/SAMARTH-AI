from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.schemas.student import StudentCreate, StudentResponse
from app.schemas.opportunity import OpportunityCreate, OpportunityResponse
from app.schemas.application import ApplicationCreate, ApplicationResponse

__all__ = [
    "UserRegister", "UserLogin", "Token", "UserResponse",
    "StudentCreate", "StudentResponse",
    "OpportunityCreate", "OpportunityResponse",
    "ApplicationCreate", "ApplicationResponse"
]
