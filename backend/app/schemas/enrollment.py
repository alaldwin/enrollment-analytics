
from pydantic import BaseModel

from backend.app.schemas.pagination import PaginationMetadata


class EnrollmentRecord(BaseModel):
    enrollment_key: str

    # Student information
    student_id: str | None = None
    sex: str | None = None
    age: int | None = None
    city: str | None = None

    # Program information
    program_code: str | None = None
    program: str | None = None
    course: str | None = None

    # Campus information
    campus: str | None = None

    # Academic period information
    academic_year: str | None = None
    academic_year_start: int | None = None
    trimester: str | None = None

    # Admission information
    admission_type: str | None = None

    # Enrollment information
    year_level: int
    year_level_name: str
    enrollment_status: str
    enrollment_count: int
    total_units_enrolled: int

    # Data quality
    is_synthetic: bool


class EnrollmentListResponse(BaseModel):
    items: list[EnrollmentRecord]
    pagination: PaginationMetadata
