
from decimal import Decimal

from pydantic import BaseModel


class EnrollmentKPIs(BaseModel):
    total_enrollments: int
    total_students: int
    total_programs: int
    total_campuses: int
    total_academic_periods: int
    total_units_enrolled: int

    # Enrollment status counts
    enrolled_records: int
    dropped_records: int
    loa_records: int

    # Year-level counts
    first_year_enrollments: int
    second_year_enrollments: int
    third_year_enrollments: int
    fourth_year_enrollments: int


class YearLevelAnalytics(BaseModel):
    year_level: int
    year_level_name: str
    total_enrollments: int
    total_students: int
    total_units: int


class ProgramAnalytics(BaseModel):
    program_key: str
    program_code: str
    program: str
    course: str | None = None
    total_enrollments: int
    total_students: int
    total_units: int



class CampusAnalytics(BaseModel):
    campus_key: str
    campus: str
    total_enrollments: int
    total_students: int
    total_units: int

class AcademicPeriodAnalytics(BaseModel):
    academic_year: str
    academic_year_start: int
    trimester: str
    total_enrollments: int
    total_students: int
    total_units: int



class EnrollmentTrend(BaseModel):
    academic_year: str
    trimester: str
    total_enrollments: int
    total_students: int
    previous_period_enrollments: int | None = None
    enrollment_change: int | None = None
    enrollment_growth_percentage: Decimal | None = None

class ProgramEnrollmentTrend(BaseModel):
    academic_year: str
    academic_year_start: int
    trimester: str
    program_code: str
    program: str
    total_enrollments: int