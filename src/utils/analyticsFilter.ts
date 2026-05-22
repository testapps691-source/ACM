import type { AnalyticsDataPoint } from '../types/domain'

export function filterAnalyticsData(
  data: AnalyticsDataPoint[],
  startDate: string,
  endDate: string
): AnalyticsDataPoint[] {
  return data.filter(d => d.date >= startDate && d.date <= endDate)
}
