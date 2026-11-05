import { apiGet } from './api'
import type { AcademicPeriodAnalytics } from '../types/analytics'

export async function getAcademicPeriodAnalytics(
  accessToken: string,
): Promise<AcademicPeriodAnalytics[]> {
  return apiGet<AcademicPeriodAnalytics[]>(
    '/analytics/academic-periods',
    accessToken,
  )
}