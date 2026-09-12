from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.student import Student
from app.models.opportunity import Opportunity
from app.utils.security import get_password_hash

SEED_STUDENTS_DATA = [
    {
        "name": "Aarav Sharma",
        "email": "aarav.sharma@iitd.ac.in",
        "mobile": "9876543210",
        "college": "IIT Delhi",
        "skills": ["python", "machine learning", "data analysis", "tensorflow"],
        "interests": ["AI", "research"],
        "preferred_domain": "AI/ML",
        "projects": "Built a CNN model to detect crop diseases from leaf images.",
        "resume_metadata": {"filename": "aarav_sharma_resume.pdf", "size": 1048576, "type": "application/pdf", "uploaded_at": "2026-09-10T10:00:00Z"}
    },
    {
        "name": "Priya Verma",
        "email": "priya.verma@iitd.ac.in",
        "mobile": "9876543211",
        "college": "IIT Delhi",
        "skills": ["python", "sql", "data visualization", "excel"],
        "interests": ["policy", "analytics"],
        "preferred_domain": "Data Analysis",
        "projects": "Analyzed public health datasets to visualize district-level trends.",
        "resume_metadata": {"filename": "priya_verma_resume.pdf", "size": 890123, "type": "application/pdf", "uploaded_at": "2026-09-10T10:00:00Z"}
    },
    {
        "name": "Rohan Mehta",
        "email": "rohan.mehta@nitt.edu",
        "mobile": "9876543212",
        "college": "NIT Trichy",
        "skills": ["react", "javascript", "css", "html"],
        "interests": ["frontend", "design systems"],
        "preferred_domain": "Web Dev",
        "projects": "Built a portfolio site and a small e-commerce UI clone in React.",
        "resume_metadata": {"filename": "rohan_mehta_resume.pdf", "size": 654321, "type": "application/pdf", "uploaded_at": "2026-09-10T10:00:00Z"}
    },
    {
        "name": "Sneha Patil",
        "email": "sneha.patil@acropolis.in",
        "mobile": "9876543213",
        "college": "Acropolis Institute of Technology and Research",
        "skills": ["figma", "ui design", "prototyping", "user research"],
        "interests": ["design", "accessibility"],
        "preferred_domain": "Design",
        "projects": "Designed a Figma prototype for a campus event app.",
        "resume_metadata": {"filename": "sneha_patil_resume.pdf", "size": 750000, "type": "application/pdf", "uploaded_at": "2026-09-10T10:00:00Z"}
    },
    {
        "name": "Karan Singh",
        "email": "karan.singh@bits.ac.in",
        "mobile": "9876543214",
        "college": "BITS Pilani",
        "skills": ["python", "network security", "linux", "penetration testing"],
        "interests": ["security"],
        "preferred_domain": "Cybersecurity",
        "projects": "Set up a home lab to practice penetration testing on vulnerable VMs.",
        "resume_metadata": {"filename": "karan_singh_resume.pdf", "size": 950000, "type": "application/pdf", "uploaded_at": "2026-09-10T10:00:00Z"}
    }
]

SEED_OPPORTUNITIES_DATA = [
    {
        "title": "AI Research Intern",
        "org": "TechNova Labs",
        "domain": "AI/ML",
        "location": "Remote",
        "stipend": 15000.0,
        "required_skills": ["python", "machine learning", "tensorflow", "data analysis"],
        "description": "Work on applied ML research projects, building and evaluating models for real-world datasets.",
        "seats_total": 3
    },
    {
        "title": "Frontend Developer Intern",
        "org": "Digital India Foundation",
        "domain": "Web Dev",
        "location": "Delhi",
        "stipend": 12000.0,
        "required_skills": ["react", "javascript", "css", "ui/ux"],
        "description": "Build citizen-facing interfaces for a government digital services portal.",
        "seats_total": 4
    },
    {
        "title": "Data Analyst Intern",
        "org": "NITI Aayog Policy Cell",
        "domain": "Data Analysis",
        "location": "Delhi",
        "stipend": 10000.0,
        "required_skills": ["python", "sql", "excel", "data visualization"],
        "description": "Analyze public datasets to support policy research and dashboards.",
        "seats_total": 2
    },
    {
        "title": "UI/UX Design Intern",
        "org": "Setu Design Studio",
        "domain": "Design",
        "location": "Bengaluru",
        "stipend": 8000.0,
        "required_skills": ["figma", "ui design", "user research", "prototyping"],
        "description": "Design flows and prototypes for a student-facing mobile app.",
        "seats_total": 2
    },
    {
        "title": "Cybersecurity Intern",
        "org": "CERT-In",
        "domain": "Cybersecurity",
        "location": "Remote",
        "stipend": 14000.0,
        "required_skills": ["network security", "python", "linux", "penetration testing"],
        "description": "Assist in vulnerability assessments and security advisories.",
        "seats_total": 2
    },
    {
        "title": "Public Policy Research Intern",
        "org": "Ministry of Rural Development",
        "domain": "Government/Policy",
        "location": "Delhi",
        "stipend": 9000.0,
        "required_skills": ["research", "writing", "data analysis", "excel"],
        "description": "Support field-data-backed research briefs for rural development schemes.",
        "seats_total": 3
    },
    {
        "title": "Backend Developer Intern",
        "org": "Bharat Cloud Services",
        "domain": "Web Dev",
        "location": "Pune",
        "stipend": 13000.0,
        "required_skills": ["python", "fastapi", "sql", "docker"],
        "description": "Build and scale APIs for a national cloud services platform.",
        "seats_total": 3
    },
    {
        "title": "ML Engineering Intern",
        "org": "AgriTech Innovations",
        "domain": "AI/ML",
        "location": "Hyderabad",
        "stipend": 16000.0,
        "required_skills": ["machine learning", "python", "computer vision", "pytorch"],
        "description": "Build computer vision models for crop health monitoring.",
        "seats_total": 2
    },
    {
        "title": "Digital Marketing Intern",
        "org": "Skill India Mission",
        "domain": "Marketing",
        "location": "Remote",
        "stipend": 7000.0,
        "required_skills": ["seo", "content writing", "social media", "analytics"],
        "description": "Run outreach campaigns to raise awareness of skilling programs.",
        "seats_total": 4
    },
    {
        "title": "Full Stack Developer Intern",
        "org": "Startup Setu",
        "domain": "Web Dev",
        "location": "Bengaluru",
        "stipend": 12000.0,
        "required_skills": ["react", "node.js", "mongodb", "javascript"],
        "description": "Ship features end-to-end for an early-stage startup product.",
        "seats_total": 3
    }
]

def seed_database(db: Session):
    # 1. Seed Demo Users idempotently
    demo_users = [
        {"email": "student@samarth.ai", "password": "password123", "role": "student"},
        {"email": "recruiter@samarth.ai", "password": "password123", "role": "recruiter"},
        {"email": "admin@samarth.ai", "password": "admin123", "role": "admin"},
    ]

    recruiter_user = None

    for u in demo_users:
        existing = db.query(User).filter(func.lower(User.email) == u["email"].lower()).first()
        if not existing:
            user = User(
                email=u["email"].lower(),
                password_hash=get_password_hash(u["password"]),
                role=u["role"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            if u["role"] == "recruiter":
                recruiter_user = user
        elif u["role"] == "recruiter":
            recruiter_user = existing

    # 2. Seed initial students idempotently
    student_user = db.query(User).filter(func.lower(User.email) == "student@samarth.ai").first()
    for sdata in SEED_STUDENTS_DATA:
        existing_student = db.query(Student).filter(func.lower(Student.email) == sdata["email"].lower()).first()
        if not existing_student:
            st = Student(
                user_id=student_user.id if (student_user and sdata["email"] == "student@samarth.ai") else None,
                name=sdata["name"],
                email=sdata["email"].lower(),
                mobile=sdata["mobile"],
                college=sdata["college"],
                skills=sdata["skills"],
                interests=sdata["interests"],
                preferred_domain=sdata["preferred_domain"],
                projects=sdata["projects"],
                resume_metadata=sdata["resume_metadata"]
            )
            db.add(st)
            db.commit()

    # 3. Seed initial opportunities idempotently
    for odata in SEED_OPPORTUNITIES_DATA:
        existing_opp = db.query(Opportunity).filter(
            Opportunity.title == odata["title"],
            Opportunity.org == odata["org"]
        ).first()
        if not existing_opp:
            opp = Opportunity(
                recruiter_id=recruiter_user.id if recruiter_user else None,
                title=odata["title"],
                org=odata["org"],
                domain=odata["domain"],
                location=odata["location"],
                stipend=odata["stipend"],
                required_skills=odata["required_skills"],
                description=odata["description"],
                seats_total=odata["seats_total"],
                seats_filled=0,
                is_active=True
            )
            db.add(opp)
            db.commit()
