WITH source AS (

    SELECT DISTINCT
        admission_type
    FROM {{ ref('int_enrollment') }}
    WHERE admission_type IS NOT NULL

)

SELECT
    MD5(admission_type) AS admission_key,
    admission_type

FROM source