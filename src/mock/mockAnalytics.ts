import type { AnalyticsDataPoint } from '../types/domain'

function generateAnalytics(): AnalyticsDataPoint[] {
  const points: AnalyticsDataPoint[] = []
  const today = new Date('2026-05-05')
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const date = d.toISOString().split('T')[0]
    // Simulate gradual improvement in MTTR/MTTD over time
    const base = i / 90
    const mttr = parseFloat((8 + base * 16 + (Math.random() * 4 - 2)).toFixed(1))
    const mttd = parseFloat((3 + base * 9 + (Math.random() * 2 - 1)).toFixed(1))
    points.push({ date, mttr: Math.max(1, mttr), mttd: Math.max(0.5, mttd) })
  }
  return points
}

export const mockAnalytics: AnalyticsDataPoint[] = generateAnalytics()
