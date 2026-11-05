
from analytics.services.query_executor import execute_query


def get_enrollment_trends() -> list[dict]:
    """
    Return enrollment trends and period-over-period changes.
    """

    return execute_query("enrollment_trends.sql")


def get_program_enrollment_trends() -> list[dict]:
    """
    Return enrollment trends grouped by academic period and program.
    """

    return execute_query("program_enrollment_trends.sql")