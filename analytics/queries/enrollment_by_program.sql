SELECT 
    p.program_key, 
    p.program_code,  
    p.program,
    c.college AS course,

    COUNT(f.enrollment_key) AS total_enrollments,
    COUNT(DISTINCT f.student_key) AS total_students,
    COALESCE(SUM(f.total_units_enrolled), 0) AS total_units

FROM enroll.fact_enrollment AS f

LEFT JOIN enroll.dim_program AS p
    ON f.program_key = p.program_key

LEFT JOIN enroll.dim_college AS c
    ON f.college_key = c.college_key

GROUP BY
    p.program_key,
    p.program_code,
    p.program,
    c.college

ORDER BY total_enrollments DESC; 