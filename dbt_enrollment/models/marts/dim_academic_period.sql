WITH source AS (

    SELECT DISTINCT
        academic_year,
        academic_year_start,
        trimester
    FROM {{ ref('int_enrollment') }}
    WHERE academic_year IS NOT NULL
      AND trimester IS NOT NULL

)

SELECT
    MD5(
        CONCAT(academic_year, '||', trimester)
    ) AS academic_period_key,

    academic_year,
    academic_year_start,
    trimester

FROM source