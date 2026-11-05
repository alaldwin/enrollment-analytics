
import { apiGet } from './api'
import type { EnrollmentListResponse } from '../types/analytics'

export interface EnrollmentFilters {
  page?: number
  page_size?: number
  year_level?: number
  enrollment_status?: string
  search?: string
}

export async function getEnrollments(
  accessToken: string,
  filters: EnrollmentFilters = {},
): Promise<EnrollmentListResponse> {
  const params = new URLSearchParams()

  if (filters.page !== undefined) {
    params.set('page', String(filters.page))
  }

  if (filters.page_size !== undefined) {
    params.set('page_size', String(filters.page_size))
  }

  if (filters.year_level !== undefined) {
    params.set('year_level', String(filters.year_level))
  }

  if (filters.enrollment_status) {
    params.set('enrollment_status', filters.enrollment_status)
  }

  if (filters.search) params.set('search', filters.search)

  const queryString = params.toString()
  const endpoint = queryString
    ? `/enrollments/?${queryString}`
    : '/enrollments/'

  return apiGet<EnrollmentListResponse>(
    endpoint,
    accessToken,
  )
}
