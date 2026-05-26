# Academic Timetable Optimizer

SmartSchedule Institute is a production-grade MVP for automatic academic timetable generation in a technical institute. It combines a FastAPI backend, PostgreSQL database, Google OR-Tools CP-SAT optimizer, and a Vite React TypeScript frontend.

## Main Features

- Admin and teacher JWT authentication.
- Teacher profile and availability management.
- CRUD for terms, programs, cycles, sections, courses, rooms, time slots, course offerings, and manual locks.
- OR-Tools CP-SAT schedule generation with hard constraints and weighted soft penalties.
- Controlled variation through random seeds, multiple candidates, and previous-term diversity scoring.
- Stored schedule runs, assignments, assignment-slot coverage, conflicts, recommendations, audit logs, and published schedules.
- Schedule views by section, teacher, and room.
- Excel and PDF export.
- Seed data for a complete demo.

## Architecture

```text
frontend/ Vite React TS
  -> /api calls with JWT
backend/ FastAPI
  -> SQLAlchemy models + Alembic migrations
  -> scheduler data loader/domain/constraints/scorer/solver/persistence
PostgreSQL
  -> academic master data + schedule runs + audit logs
Google OR-Tools CP-SAT
  -> binary placement variables x(session, start_slot, room)
```

## OR-Tools CP-SAT Model

Each course offering is expanded into required sessions. The solver creates Boolean variables only for feasible placements: a session, a start time slot, and a room. A placement is feasible only if it fits consecutive atomic one-hour slots, matches teacher availability, section shift, room type, room capacity, room unavailability, and manual-lock rules.

Hard constraints include exactly-once assignment, teacher/section/room no-overlap, teacher max weekly hours, max daily hours, max consecutive blocks, compatible room type, room capacity, section shift, active-data filtering, and manual locks.

Soft penalties include discouraged slots, non-preferred slots, teacher gaps, section gaps, late blocks, scarce lab usage, preferred-shift mismatch, and previous-term repetition. The objective minimizes total weighted penalty.

Controlled variation is handled with `random_seed`, `candidate_count`, and a diversity repetition penalty. When previous-term assignments exist, the backend reports the percentage of comparable assignments whose time slot or room changed.

## Database Overview

The schema includes users, teacher profiles, teacher availability, academic terms, programs, cycles, sections, courses, rooms, room unavailability, time slots, course offerings, schedule runs, schedule assignments, assignment slot coverage, schedule conflicts, manual locks, audit logs, and published schedules.

## Local Setup

1. Start PostgreSQL:

```bash
docker-compose up -d postgres
```

2. Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload
```

3. Frontend:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Default frontend URL: `http://localhost:5173`.
Backend health check: `http://localhost:8000/health`.

## Demo Credentials

- Admin: `admin@example.com`
- Password: `admin123456`

Teacher demo accounts use password `teacher123456`.

## Demo Flow

1. Login as admin.
2. Review teachers, courses, sections, rooms, time slots, and offerings.
3. Go to Generate Schedule.
4. Select the active term.
5. Use `random_seed = 42`, `max_seconds = 20`, `candidate_count = 3`.
6. Click `Generate Schedule with OR-Tools`.
7. View status, objective value, soft penalty, diversity score, assignments by section/teacher/room, and conflicts.
8. Export Excel or PDF from the schedule run detail page.

## API Overview

All application routes are mounted under `/api`.

- Auth: `/auth/register-teacher`, `/auth/login`, `/auth/me`, `/auth/create-admin`
- Teachers: `/teachers`, `/me/teacher-profile`, `/me/availability`
- Academic data: `/academic-terms`, `/programs`, `/cycles`, `/sections`, `/courses`, `/rooms`, `/time-slots`, `/course-offerings`
- Scheduling: `/schedule-runs/generate`, `/schedule-runs/{id}`, `/schedule-runs/{id}/assignments/by-section`, `/by-teacher`, `/by-room`, `/conflicts`, `/publish`
- Recommendations: `/recommendations/course-offering/{course_offering_id}`
- Exports: `/exports/schedule-runs/{id}/excel`, `/exports/schedule-runs/{id}/pdf`

## Tests

```bash
cd backend
pytest
```

Core tests cover password hashing, availability precedence, feasible generation, no teacher/section/room conflicts, unavailable-slot behavior, infeasible diagnostics, and candidate placement generation.

## MVP Limitations

- Teacher-course assignments are fixed before solving.
- Atomic scheduling blocks are one hour.
- `weekly_hours` must be divisible by `session_duration_blocks`.
- No drag-and-drop schedule editing yet.
- Auth is simple JWT, not OAuth.
- Gap penalties use a compact approximation.
- Designed for local contest/demo deployment, not large multi-campus production yet.

## Future Improvements

- Drag-and-drop schedule editor.
- Background worker for long solver runs.
- Advanced CP-SAT interval variables.
- Better gap modeling.
- Teacher assignment optimization.
- Multi-objective Pareto schedule alternatives.
- What-if simulation.
- Multi-campus travel-time constraints.
- Student elective conflict handling.
- AI assistant for explaining schedule decisions.
- Mobile teacher portal.
- Calendar integration.
- Import/export from Excel templates.
- Real-time collaborative schedule editing.

## Demo-Ready Flows Added

### Role-Based Navigation

The frontend now loads `/api/auth/me` after login and redirects by role:

- Admins go to the dashboard.
- Teachers go to `My Schedule`.

Admin-only pages are protected in the router and hidden from teachers in the sidebar. Teacher pages remain available to teachers, and admins can access teacher profile/availability routes when needed.

### Frontend CRUD

The academic data pages now support create, edit, and delete for terms, programs, cycles, sections, courses, rooms, time slots, and course offerings. Each mutation refreshes the relevant table and surfaces API errors.

### Teacher Profile And Availability

Teachers can update their own profile fields, including workload limits, role, shift preference, teaching capabilities, and notes. Teachers can create, edit, and delete availability blocks with the precedence expected by the solver: unavailable blocks are forbidden, discouraged blocks are allowed with penalty, preferred blocks are favored.

### Manual Locks

Admins can manage manual locks at `/manual-locks`. A manual lock forces an offering into a room and start slot as a hard OR-Tools constraint. If the lock conflicts with availability, room capacity, section shift, room unavailability, or another lock, the run reports infeasible diagnostics.

### Optimization Weights

The Generate Schedule page includes an advanced weights panel. Admins can tune soft-constraint weights for discouraged slots, non-preferred slots, teacher and section gaps, late blocks, scarce labs, fairness, diversity repetition, and load balance. Defaults match the backend scheduler defaults.

### Publishing And My Schedule

Admins can publish feasible or optimal schedule runs from the schedule detail page. Teachers use `/my-schedule`, which reads the latest active published schedule and shows only their assignments. If nothing is published yet, teachers see an empty state.

### Filtered Exports

Full-run Excel/PDF exports remain available. Teacher Excel exports and section PDF exports now filter assignments server-side instead of returning the full run.

### Audit Logs

Admins can open `/audit` to review recent audit logs with action, entity, user id, and JSON before/after details.

### Legacy Root Next/Prisma App

This repository still contains an older root-level Next.js/Prisma app (`src/`, `prisma/`, `next.config.ts`, root `package.json`). It is internally referenced by its own root scripts and was not deleted. The Academic Timetable Optimizer uses `backend/` and `frontend/` as the active FastAPI/Vite stack.

## Local Validation Notes

Docker is required to verify PostgreSQL migrations and seed data locally. In this environment, neither `docker` nor `docker-compose` was available, so run these on a machine with Docker installed:

```bash
docker-compose up -d postgres
cd backend
alembic upgrade head
python -m app.db.seed
```
