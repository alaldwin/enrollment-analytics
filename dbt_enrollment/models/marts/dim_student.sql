WITH source AS (

    SELECT *
    FROM {{ ref('int_enrollment') }}

),

ranked AS (

    SELECT
        *,
        ROW_NUMBER() OVER (
            PARTITION BY student_id
            ORDER BY extracted_at_utc DESC, transformed_at_utc DESC
        ) AS row_num
    FROM source
    WHERE student_id IS NOT NULL

)

SELECT
    MD5(student_id) AS student_key,
    student_id,
    sex,
    city

FROM ranked
WHERE row_num = 1