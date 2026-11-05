import { apiGet } from './api'
import type { ProgramEnrollmentTrend } from '../types/analytics'

export async function getProgramEnrollmentTrends(
  accessToken: string,
): Promise<ProgramEnrollmentTrend[]> {
  return apiGet<ProgramEnrollmentTrend[]>(
    '/analytics/trends/programs',
    accessToken,
  )
}