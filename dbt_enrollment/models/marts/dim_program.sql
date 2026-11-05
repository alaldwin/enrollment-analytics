WITH source AS (

    SELECT
        UPPER(BTRIM(program_code)) AS program_code,
        LOWER(
            REGEXP_REPLACE(BTRIM(program), '\s+', ' ', 'g')
        ) AS normalized_program,
        MIN(BTRIM(program)) AS program

    FROM {{ ref('int_enrollment') }}

    WHERE program_code IS NOT NULL
      AND program IS NOT NULL

    GROUP BY
        UPPER(BTRIM(program_code)),
        LOWER(
            REGEXP_REPLACE(BTRIM(program), '\s+', ' ', 'g')
        )

)

SELECT
    MD5(
        CONCAT_WS('||', program_code, normalized_program)
    ) AS program_key,
    program_code,
    program

FROM source