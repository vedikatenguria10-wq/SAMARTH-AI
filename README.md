# SAMARTH AI — Fair Internship Matching & Allocation Platform

A production-ready platform featuring explainable internship matching, student profile validation, JWT-based role authentication, and fair seat allocation algorithms.

## Project Structure

```
samarth-ai/
├── frontend/             # React + Vite application
│   ├── src/
│   │   ├── components/   # UI components (Header, ScoreBar, Chip, StatCard, Field)
│   │   ├── pages/        # Views (StudentView, RecruiterView, AdminView, LoginPage, RegisterPage)
│   │   ├── services/     # Centralized API service layer (api.js)
│   │   ├── utils/        # Matching logic and client-side validation
│   │   ├── data/         # Domain constants and seed datasets
│   │   ├── App.jsx       # Main App with Auth & Role Routing
│   │   └── main.jsx      # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── backend/              # Python + FastAPI backend
│   ├── app/
│   │   ├── api/          # Endpoints (auth, students, health)
│   │   ├── models/       # SQLAlchemy ORM models (User, Student)
│   │   ├── schemas/      # Pydantic validation schemas
│   │   ├── services/     # Auth and business logic services
│   │   ├── utils/        # Security, JWT, and backend validation
│   │   ├── config.py     # Environment settings
│   │   ├── database.py   # SQLAlchemy setup (SQLite/PostgreSQL)
│   │   └── main.py       # FastAPI main app & routes setup
│   ├── requirements.txt
│   └── .env.example
└── README.md
```

## Running the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verify backend health: `http://localhost:8000/api/health`

## Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open browser at `http://localhost:5173`

## Demo Credentials

- **Student**: `student@samarth.ai` / `password123`
- **Recruiter**: `recruiter@samarth.ai` / `password123`
- **Admin**: `admin@samarth.ai` / `admin123`
