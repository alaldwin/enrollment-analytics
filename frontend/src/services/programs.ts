import { apiGet } from './api'
import type { ProgramAnalytics } from '../types/analytics'

export async function getProgramAnalytics(
  accessToken: string,
): Promise<ProgramAnalytics[]> {
  return apiGet<ProgramAnalytics[]>(
    '/analytics/programs',
    accessToken,
  )
}