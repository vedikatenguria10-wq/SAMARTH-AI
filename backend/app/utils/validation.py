import re
from typing import List, Dict, Any, Optional

ALLOWED_DOMAINS = [
    "AI/ML", "Web Dev", "Data Analysis", "Design",
    "Cybersecurity", "Government/Policy", "Marketing"
]

BASIC_EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
NAME_REGEX = re.compile(r"^[A-Za-z\s'\-]+$")
MOBILE_REGEX = re.compile(r"^\d{10}$")
COLLEGE_REGEX = re.compile(r"^[A-Za-z0-9\s.,'&\-()]+$")
LETTER_REGEX = re.compile(r"[A-Za-z]")

def contains_alphabetic_text(text: str) -> bool:
    return bool(LETTER_REGEX.search(text or ""))

def validate_email_address(email: str) -> bool:
    clean = (email or "").strip().lower()
    if not clean or not BASIC_EMAIL_REGEX.match(clean):
        return False
    
    parts = clean.split("@")
    if len(parts) != 2:
        return False
    
    local_part, domain_part = parts[0], parts[1]
    domain_name = domain_part.split(".")[0] # part before TLD

    # Local part MUST contain at least one letter [a-z]
    if not LETTER_REGEX.search(local_part):
        return False
    
    # Domain name MUST contain at least one letter [a-z]
    if not LETTER_REGEX.search(domain_name):
        return False
    
    return True

def validate_student_data(data: Dict[str, Any]) -> Dict[str, Optional[str]]:
    errors = {}

    # Name
    name = (data.get("name") or "").strip()
    if not (2 <= len(name) <= 60):
        errors["name"] = "Full name must be between 2 and 60 characters."
    elif not NAME_REGEX.match(name):
        errors["name"] = "Name can only contain letters, spaces, hyphens, and apostrophes."

    # Email
    email = (data.get("email") or "").strip()
    if not validate_email_address(email):
        errors["email"] = "Please enter a valid email address."

    # Mobile - EXACTLY 10 digits 0-9
    mobile = (data.get("mobile") or "").strip()
    if not MOBILE_REGEX.match(mobile):
        errors["mobile"] = "Mobile number must contain exactly 10 digits (0–9)."

    # College
    college = (data.get("college") or "").strip()
    if not (2 <= len(college) <= 120):
        errors["college"] = "College/Institution name must be between 2 and 120 characters."
    elif not COLLEGE_REGEX.match(college):
        errors["college"] = "College contains invalid characters."

    # Skills - Each skill must contain alphabetic text
    skills = data.get("skills")
    if isinstance(skills, str):
        raw_skills = [s.strip() for s in skills.split(",") if s.strip()]
    elif isinstance(skills, list):
        raw_skills = [str(s).strip() for s in skills if str(s).strip()]
    else:
        raw_skills = []

    valid_skills = [s.lower() for s in raw_skills if contains_alphabetic_text(s)]
    dedup_skills = list(dict.fromkeys(valid_skills))
    
    if len(raw_skills) != len(valid_skills) or not (1 <= len(dedup_skills) <= 15):
        errors["skills"] = "Each skill must contain valid alphabetic text (e.g. Python, React.js, C++). 1–15 skills required."

    # Interests - Each interest must contain alphabetic text
    interests = data.get("interests")
    if isinstance(interests, str):
        raw_interests = [i.strip() for i in interests.split(",") if i.strip()]
    elif isinstance(interests, list):
        raw_interests = [str(i).strip() for i in interests if str(i).strip()]
    else:
        raw_interests = []

    valid_interests = [i.lower() for i in raw_interests if contains_alphabetic_text(i)]
    dedup_interests = list(dict.fromkeys(valid_interests))

    if len(raw_interests) != len(valid_interests) or not (1 <= len(dedup_interests) <= 10):
        errors["interests"] = "Each interest must contain valid alphabetic text (e.g. AI, Data Science). 1–10 interests required."

    # Preferred Domain
    domain = data.get("preferred_domain") or data.get("preferredDomain")
    if domain not in ALLOWED_DOMAINS:
        errors["preferred_domain"] = f"Domain must be one of: {', '.join(ALLOWED_DOMAINS)}."

    # Project Description
    projects = (data.get("projects") or "").strip()
    if not (20 <= len(projects) <= 1000):
        errors["projects"] = "Project description must be between 20 and 1000 characters."
    elif not contains_alphabetic_text(projects):
        errors["projects"] = "Project description must contain meaningful alphabetic text."

    # Resume metadata
    resume = data.get("resume_metadata") or data.get("resume")
    if resume and isinstance(resume, dict):
        file_type = resume.get("type", "")
        file_name = resume.get("filename", "") or resume.get("name", "")
        size = resume.get("size", 0)

        is_pdf_mime = file_type == "application/pdf"
        is_pdf_ext = file_name.lower().endswith(".pdf")

        if not (is_pdf_mime or is_pdf_ext):
            errors["resume"] = "Resume must be a PDF document (.pdf)."
        elif size > 2 * 1024 * 1024:
            errors["resume"] = "Resume file size must not exceed 2 MB."
    else:
        errors["resume"] = "Resume (PDF, max 2 MB) is required."

    return errors


def validate_opportunity_data(data: Dict[str, Any]) -> Dict[str, Optional[str]]:
    errors = {}

    # Title - Must contain alphabetic text
    title = (data.get("title") or "").strip()
    if not (3 <= len(title) <= 100):
        errors["title"] = "Title must be between 3 and 100 characters."
    elif not contains_alphabetic_text(title):
        errors["title"] = "Title must contain meaningful text (e.g. AI Research Intern)."

    # Organization - Must contain alphabetic text
    org = (data.get("org") or "").strip()
    if not (2 <= len(org) <= 120):
        errors["org"] = "Organization name must be between 2 and 120 characters."
    elif not contains_alphabetic_text(org):
        errors["org"] = "Organization name must contain valid text."

    # Domain
    domain = data.get("domain")
    if domain not in ALLOWED_DOMAINS:
        errors["domain"] = f"Domain must be one of: {', '.join(ALLOWED_DOMAINS)}."

    # Location - Must contain alphabetic text
    location = (data.get("location") or "").strip()
    if not (2 <= len(location) <= 120):
        errors["location"] = "Location must be between 2 and 120 characters."
    elif not contains_alphabetic_text(location):
        errors["location"] = "Location must contain valid text (e.g. Remote, Delhi)."

    # Stipend - strictly numeric float/int >= 0
    stipend_raw = data.get("stipend")
    if stipend_raw is None or stipend_raw == "":
        errors["stipend"] = "Stipend is required."
    else:
        try:
            stipend_str = str(stipend_raw).strip()
            if not re.match(r"^\d+(\.\d+)?$", stipend_str):
                errors["stipend"] = "Stipend must be a non-negative numeric amount (e.g. 10000 or 0)."
            else:
                stipend_val = float(stipend_str)
                if stipend_val < 0:
                    errors["stipend"] = "Stipend cannot be negative."
        except (ValueError, TypeError):
            errors["stipend"] = "Stipend must be a non-negative numeric amount (e.g. 10000 or 0)."

    # Seats - integer >= 1
    seats_raw = data.get("seatsTotal") if "seatsTotal" in data else data.get("seats_total")
    if seats_raw is None or seats_raw == "":
        errors["seats"] = "Total seats is required."
    else:
        try:
            seats_str = str(seats_raw).strip()
            if not re.match(r"^\d+$", seats_str):
                errors["seats"] = "Seats must be an integer of at least 1."
            else:
                seats_val = int(seats_str)
                if seats_val < 1:
                    errors["seats"] = "Seats must be at least 1."
        except (ValueError, TypeError):
            errors["seats"] = "Seats must be an integer of at least 1."

    # Required Skills - Must contain alphabetic text
    req_skills = data.get("requiredSkills") if "requiredSkills" in data else data.get("required_skills")
    if isinstance(req_skills, str):
        raw_skills = [s.strip() for s in req_skills.split(",") if s.strip()]
    elif isinstance(req_skills, list):
        raw_skills = [str(s).strip() for s in req_skills if str(s).strip()]
    else:
        raw_skills = []

    valid_skills = [s.lower() for s in raw_skills if contains_alphabetic_text(s)]
    dedup_skills = list(dict.fromkeys(valid_skills))
    
    if len(raw_skills) != len(valid_skills) or not (1 <= len(dedup_skills) <= 15):
        errors["requiredSkills"] = "Required skills must contain between 1 and 15 valid skills with letters."

    # Description
    description = (data.get("description") or "").strip()
    if not (20 <= len(description) <= 2000):
        errors["description"] = "Description must be between 20 and 2000 characters."
    elif not contains_alphabetic_text(description):
        errors["description"] = "Description must contain meaningful text."

    return errors
