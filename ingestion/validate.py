
import re

import polars as pl 

from config.required_columns import REQUIRED_COLUMNS
from config.required_fields import REQUIRED_FIELDS

from common.logging import get_logger


logger = get_logger(__name__, "validate_extract.log")


VALID_YEAR_LEVELS = [1, 2, 3, 4]
VALID_SEMESTERS = ["1st", "2nd"]
VALID_ENROLLMENT_STATUSES = {
    "Enrolled",
    "Pending",
    "Dropped",
    "Withdrawn",
    "Loa",
}
VALID_STATUSES = {status.lower() for status in VALID_ENROLLMENT_STATUSES}

ENROLLMENT_KEY = [
    "student_id",
    "academic_year",
    "semester",
]



def validate_data(df: pl.DataFrame) -> pl.DataFrame:

    """
    Validate transformed enrollment records using Polars.

    Args:
        df: Transformed Polars DataFrame.

    Returns:
        pl.DataFrame: Validated enrollment DataFrame.
    """

    logger.info("\nStarting extract data validation...")

    # Check DataFrame type
    if not isinstance(df, pl.DataFrame):
        raise TypeError("Expected a Polars DataFrame.")

    # Check empty dataset
    if df.is_empty():
        raise ValueError("Enrollment dataset is empty.")

    # Check required columns
    missing_columns = set(REQUIRED_COLUMNS) - set(df.columns)

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {sorted(missing_columns)}"
        )

    # Check required fields are present in the schema
    missing_fields = set(REQUIRED_FIELDS) - set(df.columns)

    if missing_fields:
        raise ValueError(
            f"Required fields not found: {sorted(missing_fields)}"
        )

    # Check required values for nulls and blanks
    for column in REQUIRED_FIELDS:

        null_count = df.get_column(column).null_count()

        if null_count > 0:
            raise ValueError(
                f"Column '{column}' contains {null_count} null values."
            )

        blank_count = df.select(
            (
                pl.col(column)
                .cast(pl.String)
                .str.strip_chars()
                == ""
            )
            .fill_null(False)
            .sum()
        ).item()

        if blank_count > 0:
            raise ValueError(
                f"Column '{column}' contains {blank_count} blank values."
            )

    # Check duplicate enrollment records
    missing_key_columns = set(ENROLLMENT_KEY) - set(df.columns)

    if missing_key_columns:
        raise ValueError(
            f"Missing enrollment key columns: {sorted(missing_key_columns)}"
        )

    unique_count = df.unique(
        subset=ENROLLMENT_KEY
    ).height

    duplicate_count = df.height - unique_count

    if duplicate_count > 0:
        raise ValueError(
            f"Found {duplicate_count} duplicate enrollment records."
        )

    # Validate year levels
    invalid_years = df.filter(
        ~pl.col("year_level").is_in(VALID_YEAR_LEVELS)
        | pl.col("year_level").is_null()
    )

    if not invalid_years.is_empty():
        invalid_values = (
            invalid_years
            .get_column("year_level")
            .unique()
            .to_list()
        )

        raise ValueError(
            f"Invalid year levels: {invalid_values}"
        )

    # Validate semester
    invalid_semesters = df.filter(
        ~pl.col("semester")
        .cast(pl.String)
        .str.strip_chars()
        .str.to_lowercase()
        .is_in(VALID_SEMESTERS)
    )

    if not invalid_semesters.is_empty():
        invalid_values = (
            invalid_semesters
            .get_column("semester")
            .unique()
            .to_list()
        )

        raise ValueError(
            f"Invalid semester values: {invalid_values}"
        )

    # Validate academic year format
    invalid_academic_years = df.filter(
        ~pl.col("academic_year")
        .cast(pl.String)
        .str.contains(r"^\d{4}-\d{4}$")
    )

    if not invalid_academic_years.is_empty():
        invalid_values = (
            invalid_academic_years
            .get_column("academic_year")
            .unique()
            .to_list()
        )

        raise ValueError(
            f"Invalid academic year format: {invalid_values}"
        )

    # Validate age
    invalid_ages = df.filter(
        ~pl.col("age").is_between(15, 100)
        | pl.col("age").is_null()
    )

    if not invalid_ages.is_empty():
        invalid_values = (
            invalid_ages
            .get_column("age")
            .unique()
            .to_list()
        )

        raise ValueError(
            f"Age must be between 15 and 100: {invalid_values}"
        )

    # Validate units enrolled
    invalid_units = df.filter(
        ~pl.col("units_enrolled").is_between(1, 40)
        | pl.col("units_enrolled").is_null()
    )

    if not invalid_units.is_empty():
        invalid_values = (
            invalid_units
            .get_column("units_enrolled")
            .unique()
            .to_list()
        )

        raise ValueError(
            f"Units enrolled must be between 1 and 40: {invalid_values}"
        )

    # Validate enrollment status
    invalid_statuses = df.filter(
        ~pl.col("enrollment_status")
        .cast(pl.String)
        .str.strip_chars()
        .str.to_lowercase()
        .is_in(VALID_STATUSES)
    )

    if not invalid_statuses.is_empty():
        invalid_values = (
            invalid_statuses
            .get_column("enrollment_status")
            .unique()
            .to_list()
        )

        raise ValueError(
            f"Invalid enrollment statuses: {invalid_values}"
        )

    # Validate year-level category consistency
    expected_year_names = {
        1: "First Year",
        2: "Second Year",
        3: "Third Year",
        4: "Fourth Year",
    }

    invalid_year_names = df.filter(
        pl.col("year_level_name")
        != pl.col("year_level").replace_strict(
            expected_year_names,
            return_dtype=pl.String,
        )
    )

    if not invalid_year_names.is_empty():
        raise ValueError(
            "Year-level labels do not match year_level values."
        )

    # Check extraction and transformation metadata
    metadata_columns = [
        "pipeline_run_id",
        "extracted_at_utc",
        "source_file_name",
        "transformed_at_utc",
        "transformation_version",
    ]

    missing_metadata = set(metadata_columns) - set(df.columns)

    if missing_metadata:
        raise ValueError(
            f"Missing metadata columns: {sorted(missing_metadata)}"
        )

    for column in metadata_columns:
        if df.get_column(column).null_count() > 0:
            raise ValueError(
                f"Metadata column '{column}' contains null values."
            )

    # Validation summary
    logger.info("Enrollment data validation completed successfully.")
    logger.info("Validated records: %s", f"{df.height:,}")
    logger.info("Validated columns: %s", len(df.columns))
    logger.info("Duplicate records: %s", duplicate_count)
    logger.info("All validation checks passed.")

    print("\nEnrollment data validation completed successfully.")
    print(f"Validated records: {df.height:,}")
    print(f"Validated columns: {len(df.columns)}")
    print("All validation checks passed.")

    return df
