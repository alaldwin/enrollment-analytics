

import pandas as pd
from pathlib import Path
from uuid import uuid4

from common.logging import get_logger


logger = get_logger(__name__, "Extraction.log")

PROJECT_ROOT = Path(__file__).resolve().parent.parent

SOURCE_FILE = PROJECT_ROOT / "data" / "source" / "icct_enrollment_datasets.xlsx"


def extract_data() -> pd.DataFrame:

    """
    Extract enrollment records from the sources CSV file

    Returns:
        pd.DataFrame: Raw enrollment dataset with extraction metadata.
    """

    logger.info("Starting data Extraction...")

    # Check if source file exists or Found
    if not SOURCE_FILE.exists():
        raise FileNotFoundError(f"Enrollment dataset not found: {SOURCE_FILE}")

    # Capture source file metadata
    file_stats = SOURCE_FILE.stat()

    # Generate extraction metadata
    extracted_at = pd.Timestamp.now(tz="UTC")
    pipeline_run_id = str(uuid4())

    try:
        df = pd.read_excel(
            SOURCE_FILE,
            engine="openpyxl"
        )

        logger.info(
            "Successfully extracted Excel using openpyxl."
        )

    except Exception:
        logger.exception("Failed to extract enrollment Excel dataset.")
        raise


    # check for empty dataset
    if df.empty:
        raise ValueError("Enrollment dataset is empty.")

    # Add extraction metadata
    df["extracted_at_utc"] = extracted_at
    df["pipeline_run_id"] = pipeline_run_id
    df["source_file_name"] = SOURCE_FILE.name
    df["source_file_size_bytes"] = file_stats.st_size

    df["source_file_modified_at"] = pd.to_datetime(
        file_stats.st_mtime,
        unit="s",
        utc=True
    )

    logger.info("Data extraction completed successfully.")
    
    print(f"Records extracted: {len(df):,}")
    print(f"Pipeline Run ID: {pipeline_run_id}")
    print(f"Extraction timestamp: {extracted_at}")
    print(f"Source file: {SOURCE_FILE.name}")

    return df