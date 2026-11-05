
SELECT
    p.program_key,
    p.program_code,
    p.program,
    p.course,
    COUNT(f.enrollment_key) AS total_enrollments,
    COUNT(DISTINCT f.student_key) AS total_students,
    COALESCE(SUM(f.total_units_enrolled), 0) AS total_units

FROM enroll.fact_enrollment AS f

LEFT JOIN enroll.dim_program AS p
    ON f.program_key = p.program_key

GROUP BY
    p.program_key,
    p.program_code,
    p.program,
    p.course
    
ORDER BY total_enrollments DESC;
