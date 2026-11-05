
SELECT
    c.campus_key,
    c.campus,
    COUNT(f.enrollment_key) AS total_enrollments,
    COUNT(DISTINCT f.student_key) AS total_students,
    COALESCE(SUM(f.total_units_enrolled), 0) AS total_units
FROM enroll.fact_enrollment AS f
LEFT JOIN enroll.dim_campus AS c
    ON f.campus_key = c.campus_key
GROUP BY
    c.campus_key,
    c.campus
ORDER BY total_enrollments DESC;
