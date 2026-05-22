import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockEnterpriseUsers } from '../mock/mockEnterpriseUsers'
import { mockRoleAssignments } from '../mock/mockRoleAssignments'
import { computeRiskScore, getRiskBg } from '../utils/riskScoreEngine'
function RiskGauge({ score }: { score: number }) {
  const pct = (score / 10) * 100
  const color = score <= 2 ? '#10b981' : score <= 5 ? '#f59e0b' : score <= 8 ? '#f97316' : '#ef4444'
  return (
    <div className="relative w-24 h-24">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="12" />
        <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${pct * 2.51} 251`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold" style={{ color }}>{score}</span>
        <span className="text-[9px] text-gray-400">/10</span>
      </div>
    </div>
  )
}

function FactorBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = max > 0 ? (score / max) * 100 : 0
  const color = pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-orange-400' : pct >= 20 ? 'bg-yellow-400' : 'bg-green-400'
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="w-44 text-gray-600 truncate">{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-16 text-right text-gray-500">{score}/{max}</div>
    </div>
  )
}

export function RiskScorePage() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string>(mockEnterpriseUsers[0].id)
  const [sortBy, setSortBy] = useState<'score' | 'name'>('score')

  const scoredUsers = useMemo(() =>
    mockEnterpriseUsers.map(u => ({
      user: u,
      breakdown: computeRiskScore(u, mockRoleAssignments),
    })).sort((a, b) => sortBy === 'score' ? b.breakdown.total - a.breakdown.total : a.user.displayName.localeCompare(b.user.displayName)),
    [sortBy]
  )

  const selected = scoredUsers.find(x => x.user.id === selectedId) ?? scoredUsers[0]

  const levelCounts = {
    CRITICAL: scoredUsers.filter(x => x.breakdown.level === 'CRITICAL').length,
    HIGH:     scoredUsers.filter(x => x.breakdown.level === 'HIGH').length,
    MEDIUM:   scoredUsers.filter(x => x.breakdown.level === 'MEDIUM').length,
    LOW:      scoredUsers.filter(x => x.breakdown.level === 'LOW').length,
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Risk Score Engine</h1>
        <p className="text-sm text-gray-500 mt-1">
          7-factor computed risk score (0–10) per identity — drives auto-approval, monitoring, and access blocking
        </p>
      </div>

      {/* Formula explanation */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <div className="text-sm font-semibold text-indigo-900 mb-2">📐 Risk Score Formula</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-indigo-800">
          {[
            { factor: 'High/Critical Entitlements', max: '2.5' },
            { factor: 'Active SoD Conflicts', max: '2.0' },
            { factor: 'Privileged Role Active', max: '1.5' },
            { factor: 'Platforms with Access', max: '1.0' },
            { factor: 'Days Since Last Review', max: '1.0' },
            { factor: 'Identity Type (External)', max: '1.0' },
            { factor: 'Anomaly Flags (30d)', max: '1.0' },
            { factor: 'Total', max: '10.0' },
          ].map(f => (
            <div key={f.factor} className={`flex justify-between px-2 py-1 rounded ${f.factor === 'Total' ? 'bg-indigo-200 font-bold' : 'bg-white/60'}`}>
              <span>{f.factor}</span>
              <span className="font-semibold ml-2">{f.max}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
          {[
            { range: '0–2', level: 'LOW', color: 'bg-green-100 text-green-800', action: 'Auto-approve' },
            { range: '2.1–5', level: 'MEDIUM', color: 'bg-yellow-100 text-yellow-800', action: 'Standard approval' },
            { range: '5.1–8', level: 'HIGH', color: 'bg-orange-100 text-orange-800', action: 'Enhanced approval + monitoring' },
            { range: '8.1–10', level: 'CRITICAL', color: 'bg-red-100 text-red-800', action: 'Block — mandatory review' },
          ].map(l => (
            <div key={l.level} className={`px-2 py-1.5 rounded-lg ${l.color}`}>
              <div className="font-bold">{l.range} — {l.level}</div>
              <div className="text-[10px] mt-0.5 opacity-80">{l.action}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Critical', value: levelCounts.CRITICAL, color: 'text-red-600', bg: 'border-red-200' },
          { label: 'High',     value: levelCounts.HIGH,     color: 'text-orange-600', bg: 'border-orange-200' },
          { label: 'Medium',   value: levelCounts.MEDIUM,   color: 'text-yellow-600', bg: '' },
          { label: 'Low',      value: levelCounts.LOW,      color: 'text-green-600', bg: '' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-lg border ${s.bg || 'border-gray-200'} px-3 py-2 text-center shadow-sm`}>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label} Risk</div>
          </div>
        ))}
      </div>

      <div className="flex gap-5 items-start">
        {/* User list */}
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase">All Users</span>
            <button onClick={() => setSortBy(s => s === 'score' ? 'name' : 'score')}
              className="text-xs text-indigo-600 hover:text-indigo-800">
              Sort: {sortBy === 'score' ? 'Score ↓' : 'Name A-Z'}
            </button>
          </div>
          <div className="overflow-y-auto max-h-[500px]">
            {scoredUsers.map(({ user, breakdown }) => (
              <button key={user.id} onClick={() => setSelectedId(user.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-gray-50 transition-colors flex items-center justify-between ${
                  selectedId === user.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-gray-50'
                }`}>
                <div>
                  <div className="text-xs font-medium text-gray-900">{user.displayName}</div>
                  <div className="text-[10px] text-gray-400">{user.department}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${getRiskBg(breakdown.total)}`}>
                  {breakdown.total}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="flex-1 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-5 mb-5">
                <RiskGauge score={selected.breakdown.total} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-gray-900">{selected.user.displayName}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getRiskBg(selected.breakdown.total)}`}>
                      {selected.breakdown.level}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">{selected.user.jobTitle} · {selected.user.department}</div>
                  <div className="text-xs text-gray-400 mt-1">{selected.user.email}</div>
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                    💡 {selected.breakdown.recommendation}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Factor Breakdown</div>
                {selected.breakdown.factors.map(f => (
                  <div key={f.label}>
                    <FactorBar label={f.label} score={f.score} max={f.max} />
                    <div className="text-[10px] text-gray-400 ml-44 pl-3 mt-0.5">{f.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => navigate(`/users/${selected.user.id}`)}
              className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium">
              View Full Access Profile →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
