SELECT *
FROM {{ ref('fact_enrollment') }}
WHERE
    is_valid_year_level = FALSE
    OR is_valid_age = FALSE
    OR enrollment_count IS NULL
    OR total_units_enrolled IS NULL
