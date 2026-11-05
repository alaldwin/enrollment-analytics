

WITH source AS (
    SELECT *
    FROM {{source('enrollment_raw', 'enrollment')}}
),

cleaned AS (

    SELECT

        -- Student identification
        NULLIF(BTRIM(student_id), '') AS student_id,

        -- Academic information
        NULLIF(BTRIM(academic_year), '') AS academic_year,
        LOWER(NULLIF(BTRIM(semester), '')) AS trimester,
        NULLIF(BTRIM(campus), '') AS campus,
        NULLIF(BTRIM(college), '') AS course,
        NULLIF(BTRIM(program_code), '') AS program_code,
        NULLIF(BTRIM(program), '') AS program,

        CAST(year_level AS INTEGER) AS year_level,
        NULLIF(BTRIM(year_level_name), '') AS year_level_name,
        CAST(academic_year_start AS INTEGER) AS academic_year_start,

        -- Student demographics
        NULLIF(BTRIM(sex), '') AS sex,
        CAST(age AS INTEGER) AS age,
        NULLIF(BTRIM(city), '') AS city,

        -- Enrollment information
        NULLIF(BTRIM(admission_type), '') AS admission_type,
        NULLIF(BTRIM(enrollment_status), '') AS enrollment_status,
        CAST(units_enrolled AS INTEGER) AS units_enrolled,
        CAST(is_synthetic AS BOOLEAN) AS is_synthetic,

        -- ETL source metadata
        CAST(extracted_at_utc AS TIMESTAMPTZ) AS extracted_at_utc,
        pipeline_run_id,
        NULLIF(BTRIM(source_file_name), '') AS source_file_name,
        CAST(source_file_size_bytes AS BIGINT) AS source_file_size_bytes,
        CAST(source_file_modified_at AS TIMESTAMPTZ)
            AS source_file_modified_at,

        -- Transformation metadata
        CAST(transformed_at_utc AS TIMESTAMPTZ) AS transformed_at_utc,
        transformation_version

    FROM source

)

SELECT *
FROM cleaned