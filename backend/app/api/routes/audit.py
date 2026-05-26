from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.db.session import get_db
from app.models.audit import AuditLog
from app.models.user import User

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("")
def list_audit_logs(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200)).all()
