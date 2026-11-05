
import { apiGet } from './api'
import type { YearLevelAnalytics } from '../types/analytics'

export async function getYearLevelAnalytics(
  accessToken: string,
): Promise<YearLevelAnalytics[]> {
  return apiGet<YearLevelAnalytics[]>(
    '/analytics/year-level',
    accessToken,
  )
}
