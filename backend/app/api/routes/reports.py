
from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.exc import SQLAlchemyError

from analytics.services.reporting_service import (
    generate_enrollment_report,
)
from backend.app.core.permissions import require_view_reports

router = APIRouter(
    prefix="/analytics",
    tags=["Reports"],
)


@router.get("/report")
def enrollment_report(
    current_user: dict = Depends(require_view_reports),
):
    try:
        return generate_enrollment_report()

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to generate enrollment report.",
        ) from exc
