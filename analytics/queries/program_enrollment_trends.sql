SELECT
    ap.academic_year,
    ap.academic_year_start,
    ap.trimester,
    p.program_code,
    p.program,
    COUNT(f.enrollment_key) AS total_enrollments

FROM enroll.fact_enrollment AS f

INNER JOIN enroll.dim_academic_period AS ap
    ON f.academic_period_key = ap.academic_period_key

INNER JOIN enroll.dim_program AS p
    ON f.program_key = p.program_key

GROUP BY
    ap.academic_year,
    ap.academic_year_start,
    ap.trimester,
    ap.academic_period_key,
    p.program_key,
    p.program_code,
    p.program

ORDER BY
    ap.academic_year_start,
    ap.trimester,
    p.program_code;
