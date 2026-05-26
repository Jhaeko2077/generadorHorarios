<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Academic Timetable Optimizer

Purpose: production-grade MVP for automatic academic schedule generation in a technical institute.

Stack:
- Backend: FastAPI, SQLAlchemy 2.x, Alembic, PostgreSQL, Google OR-Tools CP-SAT.
- Frontend: Vite, React, TypeScript, React Router, TanStack Query.
- Database: PostgreSQL only for runtime and migrations.

Run:
- PostgreSQL: `docker-compose up -d postgres`
- Backend tests: `cd backend && pytest`
- Backend app: `cd backend && uvicorn app.main:app --reload`
- Frontend app: `cd frontend && npm run dev`

Coding standards:
- Keep scheduler domain preprocessing separate from CP-SAT constraints.
- Keep hard constraints mandatory. Never bypass teacher, room, section, availability, capacity, or manual-lock constraints.
- Soft constraints must be represented as weighted penalties and remain explainable.
- Never store plaintext passwords. Use the password hashing helpers.
- Use Alembic for schema changes. Do not mutate production schema ad hoc.
- Frontend pages should remain demo-friendly, dense, and operational; prefer tables, forms, status badges, and weekly grids.

Additional project rules:
- After backend changes, run `python -m ruff check backend\app` and `python -m pytest backend\app\tests -q`.
- After frontend changes, run `cd frontend && npm run build`.
- The root Next.js/Prisma app is legacy for this scheduler project. Do not edit or remove `src/`, `prisma/`, `next.config.ts`, or root Next scripts unless the user explicitly asks.
