import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { AnalyticsDataPoint } from '../../types/domain'
import { filterAnalyticsData } from '../../utils/analyticsFilter'

interface AnalyticsPanelProps {
  data: AnalyticsDataPoint[]
}

const WINDOWS = [
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
]

export function AnalyticsPanel({ data }: AnalyticsPanelProps) {
  const [windowDays, setWindowDays] = useState(30)

  const endDate = '2026-05-05'
  const startDate = new Date('2026-05-05')
  startDate.setDate(startDate.getDate() - windowDays + 1)
  const startStr = startDate.toISOString().split('T')[0]

  const filtered = filterAnalyticsData(data, startStr, endDate)

  // Thin out data for readability
  const step = Math.max(1, Math.floor(filtered.length / 30))
  const chartData = filtered.filter((_, i) => i % step === 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">MTTR / MTTD Analytics</h3>
        <div className="flex gap-1">
          {WINDOWS.map(w => (
            <button
              key={w.days}
              onClick={() => setWindowDays(w.days)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                windowDays === w.days
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6 mb-4">
        <div>
          <div className="text-xs text-gray-400">Avg MTTR</div>
          <div className="text-lg font-bold text-indigo-600">
            {(filtered.reduce((s, d) => s + d.mttr, 0) / (filtered.length || 1)).toFixed(1)}h
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Avg MTTD</div>
          <div className="text-lg font-bold text-emerald-600">
            {(filtered.reduce((s, d) => s + d.mttd, 0) / (filtered.length || 1)).toFixed(1)}h
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
          <YAxis tick={{ fontSize: 10 }} unit="h" />
          <Tooltip formatter={(v) => [`${v}h`]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="mttr" stroke="#6366f1" strokeWidth={2} dot={false} name="MTTR" />
          <Line type="monotone" dataKey="mttd" stroke="#10b981" strokeWidth={2} dot={false} name="MTTD" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
