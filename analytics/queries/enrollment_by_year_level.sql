
SELECT
    year_level,
    CASE year_level
        WHEN 1 THEN 'First Year'
        WHEN 2 THEN 'Second Year'
        WHEN 3 THEN 'Third Year'
        WHEN 4 THEN 'Fourth Year'
        ELSE 'Unknown'
    END AS year_level_name,
    COUNT(*) AS total_enrollments,
    COUNT(DISTINCT student_key) AS total_students,
    SUM(total_units_enrolled) AS total_units
FROM enroll.fact_enrollment
GROUP BY year_level
ORDER BY year_level;
