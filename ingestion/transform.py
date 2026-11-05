
import pandas as pd
import polars as pl

from datetime import datetime, timezone

from common.logging import get_logger
from config.required_columns import REQUIRED_COLUMNS
from config.text_columns import TEXT_COLUMNS

logger = get_logger(__name__, "transform.log")


def transform_data(df: pd.DataFrame | pl.DataFrame) -> pl.DataFrame:
    """
    Clean, standardize, and transform enrollment records using Polars.

    Accepts Pandas from Excel extraction or an existing Polars DataFrame.
    Returns a Polars DataFrame.
    """

    logger.info("Starting Polars data transformation...")

    # Convert Pandas to Polars if necessary
    if isinstance(df, pd.DataFrame):
        df = pl.from_pandas(df)
    elif isinstance(df, pl.DataFrame):
        df = df.clone()
    else:
        raise TypeError(
            "Expected a Pandas or Polars DataFrame."
        )

    if df.is_empty():
        raise ValueError("Cannot transform an empty dataset.")

    # Standardize column names
    rename_mapping = {
        column: column.strip().lower().replace(" ", "_")
        for column in df.columns
    }

    df = df.rename(rename_mapping)

    # Check for duplicate column names after standardization
    if len(df.columns) != len(set(df.columns)):
        raise ValueError(
            "Duplicate column names found after standardization."
        )

    # Check required source columns
    missing_columns = set(REQUIRED_COLUMNS) - set(df.columns)

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {sorted(missing_columns)}"
        )

    # Check extraction metadata
    if "pipeline_run_id" not in df.columns:
        raise ValueError("Missing pipeline_run_id from extraction.")

    # Remove duplicate enrollment records
    before = df.height

    df = df.unique(
        subset=[
            "student_id",
            "academic_year",
            "semester",
        ],
        keep="first",
        maintain_order=True,
    )

    logger.info(
        "Duplicates removed: %s",
        before - df.height
    )

    # Clean text columns
    text_expressions = [
        pl.col(column)
        .cast(pl.String)
        .str.strip_chars()
        .alias(column)
        for column in TEXT_COLUMNS
    ]

    df = df.with_columns(text_expressions)

    # Convert numeric columns
    df = df.with_columns([
        pl.col("year_level").cast(pl.Int64, strict=False),
        pl.col("age").cast(pl.Int64, strict=False),
        pl.col("units_enrolled").cast(pl.Int64, strict=False),
    ])

    # Validate year levels
    invalid_years = df.filter(
        pl.col("year_level").is_null()
        | ~pl.col("year_level").is_in([1, 2, 3, 4])
    )

    if not invalid_years.is_empty():
        invalid_values = (
            invalid_years
            .get_column("year_level")
            .unique()
            .to_list()
        )

        raise ValueError(
            f"Invalid year levels found: {invalid_values}"
        )

    # Standardize semester
    df = df.with_columns(
        pl.col("semester")
        .str.to_titlecase()
        .alias("semester")
    )

    # Generate year-level category
    df = df.with_columns(
        pl.when(pl.col("year_level") == 1)
        .then(pl.lit("First Year"))
        .when(pl.col("year_level") == 2)
        .then(pl.lit("Second Year"))
        .when(pl.col("year_level") == 3)
        .then(pl.lit("Third Year"))
        .when(pl.col("year_level") == 4)
        .then(pl.lit("Fourth Year"))
        .otherwise(None)
        .alias("year_level_name")
    )

    # Extract academic year start
    df = df.with_columns(
        pl.col("academic_year")
        .cast(pl.String)
        .str.extract(r"^(\d{4})", group_index=1)
        .cast(pl.Int64, strict=False)
        .alias("academic_year_start")
    )

    # Standardize enrollment status
    df = df.with_columns(
        pl.col("enrollment_status")
        .str.to_titlecase()
        .alias("enrollment_status")
    )

    # Add transformation metadata
    transformed_at = datetime.now(timezone.utc)

    df = df.with_columns([
        pl.lit(transformed_at).alias("transformed_at_utc"),
        pl.lit("1.0.0").alias("transformation_version"),
    ])

    # Transformation summary
    pipeline_run_id = (
        df.get_column("pipeline_run_id")
        .first()
    )

    logger.info("Transformation completed successfully.")
    
    print("Pipeline Run ID: %s", pipeline_run_id)
    print("Transformed records: %s", f"{df.height:,}")
    print("Transformed columns: %s", len(df.columns))
    print("Transformation version: 1.0.0")

    logger.info(
        "Year-level distribution:\n%s",
        df.group_by("year_level", "year_level_name")
        .len()
        .sort("year_level")
    )

    return df
