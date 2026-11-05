

WITH enrollment_summary AS (
    SELECT
        COUNT(*) AS total_enrollments,
        COUNT(DISTINCT student_key) AS total_students,
        COUNT(DISTINCT program_key) AS total_programs,
        COUNT(DISTINCT campus_key) AS total_campuses,
        COUNT(DISTINCT academic_period_key) AS total_academic_periods,

        -- Enrollment Status Counts
        COUNT(*) FILTER (
            WHERE enrollment_status = 'Enrolled'
        ) AS enrolled_records,

        COUNT(*) FILTER (
            WHERE enrollment_status = 'Dropped'
        ) AS dropped_records,

        COUNT(*) FILTER (
            WHERE enrollment_status = 'Loa'
        ) AS loa_records,

        -- Year Level Counts
        COUNT(*) FILTER (
            WHERE year_level = 1
        ) AS first_year_enrollments,

        COUNT(*) FILTER (
            WHERE year_level = 2
        ) AS second_year_enrollments,

        COUNT(*) FILTER (
            WHERE year_level = 3
        ) AS third_year_enrollments,

        COUNT(*) FILTER (
            WHERE year_level = 4
        ) AS fourth_year_enrollments,

        COALESCE(SUM(total_units_enrolled), 0)
            AS total_units_enrolled

    FROM enroll.fact_enrollment
)

SELECT *
FROM enrollment_summary;