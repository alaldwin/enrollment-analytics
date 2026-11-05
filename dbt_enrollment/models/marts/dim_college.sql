WITH source AS (

    SELECT
        LOWER(
            REGEXP_REPLACE(
                REPLACE(BTRIM(course), '&', 'and'),
                '\s+',
                ' ',
                'g'
            )
        ) AS normalized_college,

        MIN(BTRIM(course)) AS college

    FROM {{ ref('int_enrollment') }}

    WHERE course IS NOT NULL

    GROUP BY
        LOWER(
            REGEXP_REPLACE(
                REPLACE(BTRIM(course), '&', 'and'),
                '\s+',
                ' ',
                'g'
            )
        )

)

SELECT
    MD5(normalized_college) AS college_key,
    college

FROM source