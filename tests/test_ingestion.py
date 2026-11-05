from datetime import datetime, timezone
import importlib

import pandas as pd
import polars as pl
import pytest

from ingestion import extract, load, transform, validate
import database.connection as db_connection


def build_valid_row() -> dict:
    return {
        "student_id": "S-2024-0001",
        "academic_year": "2024-2025",
        "semester": "1st",
        "campus": "Main Campus",
        "college": "College of Engineering",
        "program_code": "BSCS",
        "program": "Computer Science",
        "year_level": 1,
        "sex": "Male",
        "age": 18,
        "city": "Cebu City",
        "admission_type": "Freshmen",
        "enrollment_status": "enrolled",
        "units_enrolled": 15,
        "is_synthetic": False,
    }


def build_valid_polars_frame() -> pl.DataFrame:
    base = build_valid_row()
    base["pipeline_run_id"] = "run-123"
    base["extracted_at_utc"] = datetime.now(timezone.utc)
    base["source_file_name"] = "mock-source.xlsx"
    base["transformed_at_utc"] = datetime.now(timezone.utc)
    base["transformation_version"] = "1.0.0"
    base["year_level_name"] = "First Year"

    return pl.DataFrame([base])


def test_extract_data_reads_excel_and_adds_metadata(monkeypatch, tmp_path):
    source_file = tmp_path / "enrollment_dataset.xlsx"
    pd.DataFrame([build_valid_row()]).to_excel(source_file, index=False)

    monkeypatch.setattr(extract, "SOURCE_FILE", source_file)

    extracted = extract.extract_data()

    assert not extracted.empty
    assert {"extracted_at_utc", "pipeline_run_id", "source_file_name", "source_file_size_bytes", "source_file_modified_at"}.issubset(
        extracted.columns
    )
    assert extracted.iloc[0]["student_id"] == "S-2024-0001"


def test_transform_data_returns_expected_columns_and_values():
    raw_df = pd.DataFrame([build_valid_row()])
    raw_df["pipeline_run_id"] = "run-123"
    raw_df["extracted_at_utc"] = datetime.now(timezone.utc)
    raw_df["source_file_name"] = "mock-source.xlsx"
    raw_df["source_file_size_bytes"] = 123
    raw_df["source_file_modified_at"] = datetime.now(timezone.utc)

    transformed = transform.transform_data(raw_df)

    assert isinstance(transformed, pl.DataFrame)
    assert {"student_id", "academic_year", "semester", "year_level_name", "academic_year_start", "transformed_at_utc", "transformation_version"}.issubset(
        transformed.columns
    )
    assert transformed["semester"].to_list() == ["1St"]
    assert transformed["year_level_name"].to_list() == ["First Year"]


def test_validate_data_accepts_valid_transformed_data():
    raw_df = pd.DataFrame([build_valid_row()])
    raw_df["pipeline_run_id"] = "run-123"
    raw_df["extracted_at_utc"] = datetime.now(timezone.utc)
    raw_df["source_file_name"] = "mock-source.xlsx"
    raw_df["source_file_size_bytes"] = 123
    raw_df["source_file_modified_at"] = datetime.now(timezone.utc)

    valid_df = transform.transform_data(raw_df)
    validated = validate.validate_data(valid_df)

    assert validated.height == 1
    assert validated["year_level_name"].to_list() == ["First Year"]


def test_validate_data_rejects_invalid_enrollment_status():
    invalid_df = build_valid_polars_frame().with_columns(
        pl.lit("inactive").alias("enrollment_status")
    )

    with pytest.raises(ValueError, match="Invalid enrollment statuses"):
        validate.validate_data(invalid_df)


def test_get_incremental_rows_separates_new_and_updated_records():
    incoming = pl.DataFrame([
        {"student_id": "S-2024-0001", "academic_year": "2024-2025", "semester": "1st", "campus": "Main"},
        {"student_id": "S-2024-0002", "academic_year": "2024-2025", "semester": "1st", "campus": "South"},
        {"student_id": "S-2024-0003", "academic_year": "2024-2025", "semester": "1st", "campus": "North"},
    ])

    existing_keys = {
        ("S-2024-0001", "2024-2025", "1st"),
        ("S-2024-0002", "2024-2025", "1st"),
    }

    new_rows, updated_rows = load.get_incremental_rows(incoming, existing_keys)

    assert [row["student_id"] for row in new_rows] == ["S-2024-0003"]
    assert [row["student_id"] for row in updated_rows] == ["S-2024-0001", "S-2024-0002"]


def test_database_connection_uses_postgres_environment(monkeypatch):
    monkeypatch.setenv("POSTGRES_USER", "app_user")
    monkeypatch.setenv("POSTGRES_PASSWORD", "secure_password")
    monkeypatch.setenv("POSTGRES_HOST", "db-server")
    monkeypatch.setenv("POSTGRES_PORT", "5432")
    monkeypatch.setenv("POSTGRES_DB", "enrollment_db")

    reloaded = importlib.reload(db_connection)
    rendered = reloaded.engine.url.render_as_string(hide_password=False)

    assert "postgresql+psycopg://app_user:secure_password@db-server:5432/enrollment_db" in rendered
