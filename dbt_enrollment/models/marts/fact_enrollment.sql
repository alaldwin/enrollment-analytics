WITH source AS (

    SELECT *
    FROM {{ ref('int_enrollment') }}

),

fact AS (

    SELECT

        -- Enrollment business key
        MD5(
            CONCAT_WS(
                '||',
                student_id,
                academic_year,
                trimester
            )
        ) AS enrollment_key,

        -- Dimension foreign keys
        MD5(student_id) AS student_key,

        MD5(program_code) AS program_key,

        MD5(campus) AS campus_key,

        MD5(
            CONCAT(
                academic_year,
                '||',
                trimester
            )
        ) AS academic_period_key,

        MD5(admission_type) AS admission_key,

        -- Enrollment attributes
        year_level,
        year_level_name,
        enrollment_status,
        sex,
        age,
        city,

        -- Fact measures
        enrollment_count,
        total_units_enrolled,

        -- Data quality indicators
        is_valid_enrollment_key,
        is_valid_year_level,
        is_valid_age,

        -- Source metadata
        is_synthetic,
        pipeline_run_id,
        source_file_name,
        extracted_at_utc,
        transformed_at_utc

    FROM source

)

SELECT *
FROM fact