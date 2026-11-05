
WITH period_enrollments AS (

    SELECT
        ap.academic_year,
        ap.academic_year_start,
        ap.trimester,
        ap.academic_period_key,
        COUNT(f.enrollment_key) AS total_enrollments,
        COUNT(DISTINCT f.student_key) AS total_students

    FROM enroll.fact_enrollment AS f

    INNER JOIN enroll.dim_academic_period AS ap
        ON f.academic_period_key = ap.academic_period_key

    GROUP BY
        ap.academic_year,
        ap.academic_year_start,
        ap.trimester,
        ap.academic_period_key
),

period_comparison AS (

    SELECT
        *,
        LAG(total_enrollments) OVER (
            ORDER BY academic_year_start, trimester
        ) AS previous_period_enrollments

    FROM period_enrollments
)

SELECT
    academic_year,
    trimester,
    total_enrollments,
    total_students,
    previous_period_enrollments,

    total_enrollments - previous_period_enrollments
        AS enrollment_change,

    CASE
        WHEN previous_period_enrollments IS NULL
          OR previous_period_enrollments = 0
        THEN NULL
        ELSE ROUND(
            (
                (total_enrollments - previous_period_enrollments)::NUMERIC
                / previous_period_enrollments
            ) * 100,
            2
        )
    END AS enrollment_growth_percentage

FROM period_comparison
ORDER BY academic_year_start, trimester;
