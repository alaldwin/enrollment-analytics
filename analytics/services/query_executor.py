
from pathlib import Path

import pandas as pd
from sqlalchemy import text

from analytics.database import engine


QUERY_DIR = Path(__file__).resolve().parent.parent / "queries"


def execute_query(query_filename: str) -> list[dict]:
    """
    Execute an Analytics SQL file and return records as dictionaries.
    """

    query_path = QUERY_DIR / query_filename

    if not query_path.is_file():
        raise FileNotFoundError(
            f"Analytics query not found: {query_path}"
        )

    sql = query_path.read_text(encoding="utf-8")

    with engine.connect() as connection:
        result = connection.execute(text(sql))
        return [
            dict(row)
            for row in result.mappings().all()
        ]
