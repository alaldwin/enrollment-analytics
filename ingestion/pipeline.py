from ingestion.extract import extract_data
from ingestion.validate import validate_data
from ingestion.transform import transform_data
from ingestion.load import load_data

from common.logging import get_logger


logger = get_logger(__name__, "pipeline.log")

def run_pipeline():

    logger.info("Starting enrollment ETL pipeline")

    # Extract
    df = extract_data()

    # Transform
    df = transform_data(df)

    # Validate
    df = validate_data(df)

    # Load
    load_data(df, mode="incremental")

    print("Enrollment ETL pipeline completed")


if __name__ == "__main__":
    run_pipeline()