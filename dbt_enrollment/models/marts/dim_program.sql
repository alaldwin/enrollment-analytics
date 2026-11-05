WITH source AS (

    SELECT DISTINCT
        program_code,
        program,
        course
    FROM {{ ref('int_enrollment') }}
    WHERE program_code IS NOT NULL

)

SELECT
    MD5(program_code) AS program_key,
    program_code,
    program,
    course

FROM source