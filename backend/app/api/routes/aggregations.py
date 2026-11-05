

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from analytics.services.aggregation_service import (
    get_enrollment_by_year_level,
    get_enrollment_by_program,
    get_enrollment_by_campus,
    get_enrollment_by_semester,
)

from backend.app.core.permissions import (
    require_view_analytics,
    require_view_overview,
)

from backend.app.schemas.analytics import (
    YearLevelAnalytics,
    ProgramAnalytics,
    CampusAnalytics,
    AcademicPeriodAnalytics,
)

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)




@router.get(
    "/year-level",
    response_model=list[YearLevelAnalytics],
)
def enrollment_by_year_level(    
    current_user: dict = Depends(require_view_overview),
):
    try:
        return get_enrollment_by_year_level()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve year-level analytics.",
        ) from exc


@router.get(
    "/programs",
    response_model=list[ProgramAnalytics],    
)
def enrollment_by_program(
    current_user: dict = Depends(require_view_analytics),
):
    try:
        return get_enrollment_by_program()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve program analytics.",
        ) from exc


@router.get(
    "/campuses",
    response_model=list[CampusAnalytics],
)
def enrollment_by_campus(
    current_user: dict = Depends(require_view_analytics),
):
    try:
        return get_enrollment_by_campus()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve campus analytics.",
        ) from exc


@router.get(
    "/academic-periods",
    response_model=list[AcademicPeriodAnalytics],
)
def enrollment_by_academic_period(
    current_user: dict = Depends(require_view_analytics),
):
    try:
        return get_enrollment_by_semester()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve academic-period analytics.",
        ) from exc
