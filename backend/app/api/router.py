from __future__ import annotations

from fastapi import APIRouter

from app.api.routes import academic, audit, auth, exports, schedule_runs, teachers

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(teachers.router)
api_router.include_router(academic.router)
api_router.include_router(schedule_runs.router)
api_router.include_router(exports.router)
api_router.include_router(audit.router)
