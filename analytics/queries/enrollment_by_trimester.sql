
SELECT
    ap.academic_year,
    ap.academic_year_start,
    ap.trimester,
    COUNT(f.enrollment_key) AS total_enrollments,
    COUNT(DISTINCT f.student_key) AS total_students,
    COALESCE(SUM(f.total_units_enrolled), 0) AS total_units
FROM enroll.fact_enrollment AS f
LEFT JOIN enroll.dim_academic_period AS ap
    ON f.academic_period_key = ap.academic_period_key
GROUP BY
    ap.academic_year,
    ap.academic_year_start,
    ap.trimester
ORDER BY
    ap.academic_year_start,
    ap.trimester;
