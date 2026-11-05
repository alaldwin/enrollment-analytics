
export interface EnrollmentKPIs {
  total_enrollments: number
  total_students: number
  total_programs: number
  total_campuses: number
  enrolled_records: number
  dropped_records: number
  loa_records: number
  total_academic_periods: number
  total_units_enrolled: number
  first_year_enrollments: number
  second_year_enrollments: number
  third_year_enrollments: number
  fourth_year_enrollments: number
}



export interface YearLevelAnalytics {
  year_level: number
  year_level_name: string
  total_enrollments: number
  total_students: number
  total_units: number
}


export interface AcademicPeriodAnalytics {
  academic_year: string
  academic_year_start: number
  trimester: string
  total_enrollments: number
  total_students: number
  total_units: number
}


export interface EnrollmentRecord {
  enrollment_key: string

  student_id: string | null
  sex: string | null
  age: number | null
  city: string | null

  program_code: string | null
  program: string | null
  course: string | null

  campus: string | null

  academic_year: string | null
  academic_year_start: number | null
  trimester: string | null


  admission_type: string | null

  year_level: number
  year_level_name: string
  enrollment_status: string
  enrollment_count: number
  total_units_enrolled: number

  is_synthetic: boolean
}

export interface EnrollmentPagination {
  total: number
  page: number
  page_size: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
}

export interface EnrollmentListResponse {
  items: EnrollmentRecord[]
  pagination: EnrollmentPagination
}


export interface ProgramAnalytics {
  program_key: string
  program_code: string
  program: string
  course: string | null
  total_enrollments: number
  total_students: number
  total_units: number
}

export interface ProgramEnrollmentTrend {
  academic_year: string
  academic_year_start: number
  trimester: string
  program_code: string
  program: string
  total_enrollments: number
}


export interface CampusAnalytics {
  campus_key: string
  campus: string
  total_enrollments: number
  total_students: number
  total_units: number
}




export interface EnrollmentTrend {
  academic_year: string
  trimester: string
  total_enrollments: number
  total_students: number
  previous_period_enrollments: number | null
  enrollment_change: number | null
  enrollment_growth_percentage: string | null
}

export interface EnrollmentReport {
  kpis: EnrollmentKPIs
  year_level: YearLevelAnalytics[]
  programs: ProgramAnalytics[]
  campuses: CampusAnalytics[]
  academic_periods: AcademicPeriodAnalytics[]
  trends: EnrollmentTrend[]
}