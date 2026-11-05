from itertools import islice

import polars as pl

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    Integer,
    MetaData,
    Numeric,
    Table,
    Text,
    Time,
    and_,
    create_engine,
    func,
    inspect,
    insert,
    select,
)

from database.connection import engine
from common.logging import get_logger


logger = get_logger(__name__, "loaded.log")

SCHEMA_NAME = "raw_enroll"
TABLE_NAME = "enrollment"

BATCH_SIZE = 1000
ENROLLMENT_KEY = (
    "student_id",
    "academic_year",
    "semester",
)


def get_incremental_rows(
    df: pl.DataFrame,
    existing_keys: set[tuple],
) -> tuple[list[dict], list[dict]]:
    """
    Split a batch into rows that are new and rows that already exist.

    Existing records are identified by the enrollment natural key:
    student_id + academic_year + semester.
    """

    if not isinstance(df, pl.DataFrame):
        raise TypeError("get_incremental_rows() expects a Polars DataFrame.")

    missing_columns = set(ENROLLMENT_KEY) - set(df.columns)
    if missing_columns:
        raise ValueError(
            f"Missing enrollment key columns for incremental load: {sorted(missing_columns)}"
        )

    rows_to_insert: list[dict] = []
    rows_to_update: list[dict] = []

    for row in df.iter_rows(named=True):
        enrollment_key = tuple(row[column] for column in ENROLLMENT_KEY)
        if enrollment_key in existing_keys:
            rows_to_update.append(row)
        else:
            rows_to_insert.append(row)

    return rows_to_insert, rows_to_update


def get_sqlalchemy_type(dtype):

    """
    Map Polars data types to PostgreSQL-compatible SQLAlchemy types.
    """

    if dtype in (pl.Int8, pl.Int16, pl.Int32):
        return Integer()

    if dtype in (pl.Int64, pl.UInt8, pl.UInt16, pl.UInt32, pl.UInt64):
        return BigInteger()

    if dtype in (pl.Float32, pl.Float64):
        return Float()

    if dtype == pl.Boolean:
        return Boolean()

    if dtype == pl.Date:
        return Date()

    if dtype.base_type() == pl.Datetime:
        return DateTime(timezone=dtype.time_zone is not None)

    if dtype == pl.Time:
        return Time()

    if dtype.base_type() in (
        pl.String,
        pl.Categorical,
        pl.Enum,
        pl.Null,
    ):
        return Text()

    if dtype.base_type() == pl.Decimal:
        return Numeric(
            precision=dtype.precision,
            scale=dtype.scale,
        )

    raise TypeError(
        f"Unsupported Polars data type: {dtype}"
    )


def create_target_table(connection, df: pl.DataFrame) -> Table:

    """
    Create the target table dynamically using the Polars schema.
    """

    metadata = MetaData()

    columns = [
        Column(
            column_name,
            get_sqlalchemy_type(dtype),
            nullable=True,
        )
        for column_name, dtype in df.schema.items()
    ]

    table = Table(
        TABLE_NAME,
        metadata,
        *columns,
        schema=SCHEMA_NAME,
    )

    metadata.create_all(connection)

    return table


def load_data(df: pl.DataFrame, mode: str = "incremental") -> None:

    """
    Load validated enrollment records into PostgreSQL.

    Strategy:
    - Accept a Polars DataFrame.
    - Create the PostgreSQL schema and table if necessary.
    - Use incremental upserts by default: new rows are inserted and existing
      rows are updated based on the enrollment natural key.
    - Support an explicit mode="replace" option for a full refresh.
    - Insert records in batches.

    All database operations run in one transaction.
    """

    logger.info("Starting data loading...")

    valid_modes = {"incremental", "replace"}
    if mode not in valid_modes:
        raise ValueError(
            f"Unsupported load mode '{mode}'. Expected one of {sorted(valid_modes)}."
        )

    if not isinstance(df, pl.DataFrame):
        raise TypeError("load_data() expects a Polars DataFrame.")

    if df.is_empty():
        raise ValueError("Cannot load an empty enrollment dataset.")

    logger.info(f"Records received: {df.height:,}")

    total_records = 0
    total_inserted = 0

    with engine.begin() as connection:
        connection.exec_driver_sql(
            f'CREATE SCHEMA IF NOT EXISTS "{SCHEMA_NAME}"'
        )

        table_exists = inspect(connection).has_table(
            TABLE_NAME,
            schema=SCHEMA_NAME,
        )

        if table_exists:
            metadata = MetaData()
            table = Table(
                TABLE_NAME,
                metadata,
                schema=SCHEMA_NAME,
                autoload_with=connection,
            )

            dataframe_columns = set(df.columns)
            database_columns = set(table.columns.keys())

            if dataframe_columns != database_columns:
                raise ValueError(
                    "Database table columns do not match "
                    "the Polars DataFrame.\n"
                    f"Missing in database: "
                    f"{sorted(dataframe_columns - database_columns)}\n"
                    f"Extra in database: "
                    f"{sorted(database_columns - dataframe_columns)}"
                )

            if mode == "replace":
                connection.execute(table.delete())
                logger.info(
                    f"Cleared existing records from {SCHEMA_NAME}.{TABLE_NAME}"
                )
                rows_to_insert = list(df.iter_rows(named=True))
                rows_to_update = []
            else:
                existing_rows = connection.execute(
                    select(*(table.c[column] for column in ENROLLMENT_KEY))
                ).fetchall()
                existing_keys = {
                        tuple(
                            row._mapping[column_name]
                            for column_name in ENROLLMENT_KEY
                        )
                        for row in existing_rows
                    }
                rows_to_insert, rows_to_update = get_incremental_rows(df, existing_keys)
                logger.info(
                    "Incremental load summary: %s new rows, %s updated rows",
                    len(rows_to_insert),
                    len(rows_to_update),
                )
        else:
            table = create_target_table(connection, df)
            logger.info(f"Created table: {SCHEMA_NAME}.{TABLE_NAME}")
            rows_to_insert = list(df.iter_rows(named=True))
            rows_to_update = []

        insert_statement = insert(table)

        rows_iterator = iter(rows_to_insert)
        while True:
            batch = list(islice(rows_iterator, BATCH_SIZE))
            if not batch:
                break
            connection.execute(insert_statement, batch)
            total_inserted += len(batch)

        for row in rows_to_update:
            update_columns = [
                column_name
                for column_name in table.columns.keys()
                if column_name not in ENROLLMENT_KEY
            ]
            update_values = {
                column_name: row[column_name]
                for column_name in update_columns
            }
            where_clause = and_(
                *(
                    table.c[column_name] == row[column_name]
                    for column_name in ENROLLMENT_KEY
                )
            )
            connection.execute(
                table.update().where(where_clause).values(**update_values)
            )

        count_statement = select(func.count()).select_from(table)
        total_records = connection.execute(count_statement).scalar_one()

        if mode == "incremental":
            expected_total = len(rows_to_insert) + len(rows_to_update)
            if total_records < expected_total:
                raise RuntimeError(
                    "Record count mismatch after incremental load. "
                    f"Expected at least: {expected_total:,}, "
                    f"Found: {total_records:,}"
                )
        elif total_records != df.height:
            raise RuntimeError(
                "Record count mismatch. "
                f"Expected: {df.height:,}, "
                f"Found: {total_records:,}"
            )

    logger.info("Data loading completed successfully.")
    logger.info(f"Target table: {SCHEMA_NAME}.{TABLE_NAME}")
    logger.info(f"Records inserted: {total_inserted:,}")
    logger.info(f"Verified database records: {total_records:,}")