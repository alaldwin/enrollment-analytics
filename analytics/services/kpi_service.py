
from analytics.services.query_executor import execute_query


def get_enrollment_kpis() -> dict:
    """
    Return overall enrollment KPIs.
    """

    rows = execute_query("enrollment_kpis.sql")

    if not rows:
        return {}

    return rows[0]
