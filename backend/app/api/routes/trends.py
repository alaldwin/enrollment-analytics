
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from analytics.services.trend_service import (
    get_enrollment_trends,
    get_program_enrollment_trends,
)
from backend.app.core.permissions import require_view_analytics
from backend.app.schemas.analytics import (
    EnrollmentTrend,
    ProgramEnrollmentTrend,
)

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get(
    "/trends",
    response_model=list[EnrollmentTrend],    
)
def enrollment_trends(
    current_user: dict = Depends(require_view_analytics),
):
    try:
        return get_enrollment_trends()

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve enrollment trends.",
        ) from exc


@router.get(
    "/trends/programs",
    response_model=list[ProgramEnrollmentTrend],
)
def program_enrollment_trends(
    current_user: dict = Depends(require_view_analytics),
):
    try:
        return get_program_enrollment_trends()

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve program enrollment trends.",
        ) from exc