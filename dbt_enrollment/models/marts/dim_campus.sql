WITH source AS (

    SELECT DISTINCT
        campus
    FROM {{ ref('int_enrollment') }}
    WHERE campus IS NOT NULL

)

SELECT
    MD5(campus) AS campus_key,
    campus

FROM source