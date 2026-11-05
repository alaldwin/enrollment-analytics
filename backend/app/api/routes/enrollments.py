
from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.core.permissions import require_view_enrollments
from backend.app.schemas.enrollment import EnrollmentListResponse

router = APIRouter(
    prefix="/enrollments",
    tags=["Enrollments"],
)


@router.get(
    "/",
    response_model=EnrollmentListResponse,
)
def get_enrollments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    year_level: int | None = Query(default=None, ge=1, le=4),
    enrollment_status: str | None = Query(default=None, min_length=1),
    search: str | None = Query(default=None, min_length=1, max_length=100),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_view_enrollments),
):
    offset = (page - 1) * page_size

    filters = """
        WHERE (
            CAST(:year_level AS INTEGER) IS NULL
            OR fact.year_level = CAST(:year_level AS INTEGER)
        )
        AND (
            CAST(:enrollment_status AS TEXT) IS NULL
            OR LOWER(fact.enrollment_status) = LOWER(
                CAST(:enrollment_status AS TEXT)
            )
        )
        AND (
            CAST(:search AS TEXT) IS NULL
            OR student.student_id ILIKE '%' || CAST(:search AS TEXT) || '%'
            OR program.program ILIKE '%' || CAST(:search AS TEXT) || '%'
            OR program.program_code ILIKE '%' || CAST(:search AS TEXT) || '%'
            OR college.college ILIKE '%' || CAST(:search AS TEXT) || '%'
            OR campus.campus ILIKE '%' || CAST(:search AS TEXT) || '%'
        )
    """

    params = {
        "year_level": year_level,
        "enrollment_status": enrollment_status,
        "search": search,
        "limit": page_size,
        "offset": offset,
    }

    count_query = text(f"""
        SELECT COUNT(*)
        FROM enroll.fact_enrollment AS fact

        LEFT JOIN enroll.dim_student AS student
            ON fact.student_key = student.student_key

        LEFT JOIN enroll.dim_program AS program
            ON fact.program_key = program.program_key

        LEFT JOIN enroll.dim_college AS college
            ON fact.college_key = college.college_key

        LEFT JOIN enroll.dim_campus AS campus
            ON fact.campus_key = campus.campus_key

        {filters}
    """)

    records_query = text(f"""
        SELECT
            fact.enrollment_key,

            -- Student information
            student.student_id,
            fact.sex,
            fact.age,
            fact.city,

            -- Program and college information
            program.program_code,
            program.program,
            college.college AS course,

            -- Campus information
            campus.campus,

            -- Academic period information
            period.academic_year,
            period.academic_year_start,
            period.trimester,

            -- Admission information
            admission.admission_type,

            -- Enrollment information
            fact.year_level,
            fact.year_level_name,
            fact.enrollment_status,
            fact.enrollment_count,
            fact.total_units_enrolled,

            -- Data quality
            fact.is_synthetic

        FROM enroll.fact_enrollment AS fact

        LEFT JOIN enroll.dim_student AS student
            ON fact.student_key = student.student_key

        LEFT JOIN enroll.dim_program AS program
            ON fact.program_key = program.program_key

        LEFT JOIN enroll.dim_college AS college
            ON fact.college_key = college.college_key

        LEFT JOIN enroll.dim_campus AS campus
            ON fact.campus_key = campus.campus_key

        LEFT JOIN enroll.dim_academic_period AS period
            ON fact.academic_period_key = period.academic_period_key

        LEFT JOIN enroll.dim_admission AS admission
            ON fact.admission_key = admission.admission_key

        {filters}

        ORDER BY
            period.academic_year_start DESC NULLS LAST,
            period.trimester,
            student.student_id,
            fact.enrollment_key

        LIMIT :limit
        OFFSET :offset
    """)

    try:
        total = db.execute(
            count_query,
            params,
        ).scalar_one()

        records = db.execute(
            records_query,
            params,
        ).mappings().all()

        total_pages = ceil(total / page_size) if total else 0

        return {
            "items": [dict(record) for record in records],
            "pagination": {
                "total": total,
                "page": page,
                "page_size": page_size,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_previous": page > 1 and total > 0,
            },
        }

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail="Unable to retrieve enrollment records.",
        ) from exc
