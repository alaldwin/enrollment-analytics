
from analytics.services.kpi_service import get_enrollment_kpis
from analytics.services.aggregation_service import (
    get_enrollment_by_year_level,
    get_enrollment_by_program,
    get_enrollment_by_campus,
    get_enrollment_by_semester,
)
from analytics.services.trend_service import get_enrollment_trends


def generate_enrollment_report() -> dict:
    """
    Generate a consolidated enrollment analytics report.
    """

    return {
        "kpis": get_enrollment_kpis(),
        "year_level": get_enrollment_by_year_level(),
        "programs": get_enrollment_by_program(),
        "campuses": get_enrollment_by_campus(),
        "academic_periods": get_enrollment_by_semester(),
        "trends": get_enrollment_trends(),
    }
