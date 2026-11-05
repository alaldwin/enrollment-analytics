from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError

from analytics.services.kpi_service import get_enrollment_kpis
from backend.app.schemas.analytics import EnrollmentKPIs
from backend.app.core.permissions import require_view_overview

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get(
    "/kpis",
    response_model=EnrollmentKPIs,
)
def enrollment_kpis(
    current_user: dict = Depends(require_view_overview),
):
    try:
        return get_enrollment_kpis()

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve enrollment KPIs.",
        ) from exc