WITH staging AS (

    SELECT *
    FROM {{ ref('stg_enrollment') }}

),


enriched AS (

    SELECT

        -- Enrollment identification
        student_id,
        pipeline_run_id,

        -- Academic attributes
        academic_year,
        academic_year_start,
        trimester,
        campus,

        -- College and program attributes
        course,
        program_code,
        program,

        -- Student attributes
        year_level,
        year_level_name,
        sex,
        age,
        city,

        -- Admission and enrollment attributes
        admission_type,
        enrollment_status,

        -- Enrollment facts and measures
        units_enrolled,

        1::INTEGER AS enrollment_count,

        COALESCE(units_enrolled, 0)::INTEGER
            AS total_units_enrolled,

        -- Data quality and business-rule flags
        CASE
            WHEN student_id IS NOT NULL
             AND academic_year IS NOT NULL
             AND trimester IS NOT NULL
            THEN TRUE
            ELSE FALSE
        END AS is_valid_enrollment_key,

        CASE
            WHEN year_level IN (1, 2, 3, 4)
            THEN TRUE
            ELSE FALSE
        END AS is_valid_year_level,

        CASE
            WHEN age IS NOT NULL AND age > 0
            THEN TRUE
            ELSE FALSE
        END AS is_valid_age,

        -- Source lineage
        is_synthetic,
        extracted_at_utc,
        source_file_name,
        source_file_size_bytes,
        source_file_modified_at,
        transformed_at_utc,
        transformation_version

    FROM staging

)

SELECT *
FROM enriched