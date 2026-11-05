import { apiGet } from './api'
import type { CampusAnalytics } from '../types/analytics'

export async function getCampusAnalytics(
  accessToken: string,
): Promise<CampusAnalytics[]> {
  return apiGet<CampusAnalytics[]>(
    '/analytics/campuses',
    accessToken,
  )
}