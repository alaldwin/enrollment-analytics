
from analytics.services.query_executor import execute_query


def get_enrollment_by_year_level() -> list[dict]:
    return execute_query("enrollment_by_year_level.sql")


def get_enrollment_by_program() -> list[dict]:
    return execute_query("enrollment_by_program.sql")


def get_enrollment_by_campus() -> list[dict]:
    return execute_query("enrollment_by_campus.sql")


def get_enrollment_by_semester() -> list[dict]:
    return execute_query("enrollment_by_trimester.sql")
