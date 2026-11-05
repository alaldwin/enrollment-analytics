import { apiGet } from './api'

import type {
  EnrollmentKPIs,
  EnrollmentReport,
} from '../types/analytics'

export async function getEnrollmentKPIs(
  accessToken: string,
): Promise<EnrollmentKPIs> {
  return apiGet<EnrollmentKPIs>(
    '/analytics/kpis',
    accessToken,
  )
}

export async function getEnrollmentReport(
  accessToken: string,
): Promise<EnrollmentReport> {
  return apiGet<EnrollmentReport>(
    '/analytics/report',
    accessToken,
  )
}