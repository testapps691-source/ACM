import { useState, useMemo } from 'react'
import { mockRoleAssignments } from '../mock/mockRoleAssignments'
import { mockEnterpriseUsers } from '../mock/mockEnterpriseUsers'
import type { RoleAssignment } from '../types/domain'
import { Badge } from '../components/ui/Badge'
import { SYSTEM_COLORS, SYSTEM_LABELS } from '../utils/buildGraphData'

type CampaignStatus = 'active' | 'completed' | 'draft'
type ReviewDecision = 'certify' | 'revoke' | 'pending'

interface ReviewItem {
  assignment: RoleAssignment
  decision: ReviewDecision
  recommendation: 'certify' | 'revoke' | 'review'
  recommendationReason: string
}

interface Campaign {
  id: string
  name: string
  type: string
  status: CampaignStatus
  startDate: string
  endDate: string
  totalItems: number
  completedItems: number
  scope: string
}

const mockCampaigns: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Q2 2026 Quarterly Access Review',
    type: 'Periodic',
    status: 'active',
    startDate: '2026-05-01',
    endDate: '2026-05-14',
    totalItems: 28,
    completedItems: 11,
    scope: 'All production high-privilege roles',
  },
  {
    id: 'camp-2',
    name: 'SAP BTP Finance Roles — SOX Certification',
    type: 'SOX Compliance',
    status: 'active',
    startDate: '2026-05-03',
    endDate: '2026-05-17',
    totalItems: 12,
    completedItems: 4,
    scope: 'SAP BTP Finance roles — all environments',
  },
  {
    id: 'camp-3',
    name: 'Contractor Access Review — Q1 2026',
    type: 'Contractor',
    status: 'completed',
    startDate: '2026-02-01',
    endDate: '2026-02-14',
    totalItems: 8,
    completedItems: 8,
    scope: 'All contractor and partner access',
  },
]

function getRecommendation(a: RoleAssignment): { rec: 'certify' | 'revoke' | 'review'; reason: string } {
  // Check dormant: lastUsed > 90 days, or no lastUsed AND assigned > 180 days ago
  const daysSinceAssigned = Math.floor((Date.now() - new Date(a.assignedAt).getTime()) / 86400000)
  if (a.lastUsed) {
    const daysSinceUsed = Math.floor((Date.now() - new Date(a.lastUsed).getTime()) / 86400000)
    if (daysSinceUsed > 90) return { rec: 'revoke', reason: `Not used in ${daysSinceUsed} days — dormant access` }
  } else if (daysSinceAssigned > 180) {
    return { rec: 'revoke', reason: `No usage recorded — assigned ${daysSinceAssigned} days ago` }
  }
  if (a.role.sodConflicts.length > 0) return { rec: 'review', reason: 'SoD conflict detected — mandatory human review' }
  if (a.role.isHighPrivilege) return { rec: 'review', reason: 'High-privilege role — requires explicit certification' }
  if (a.lifecycleStage === 'recertification-due') return { rec: 'review', reason: 'Recertification due — access not recently certified' }
  const user = mockEnterpriseUsers.find(u => u.id === a.principalId)
  if (user && (user.status === 'inactive' || user.status === 'suspended')) {
    return { rec: 'revoke', reason: `User is ${user.status} — access should be revoked` }
  }
  return { rec: 'certify', reason: 'Active usage, no conflicts, low risk' }
}

function ProgressBar({ value, total, color }: { value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-16 text-right">{value}/{total} ({pct}%)</span>
    </div>
  )
}

export function AccessReviewPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign>(mockCampaigns[0])
  const [items, setItems] = useState<ReviewItem[]>(() => {
    const highPriv = mockRoleAssignments.filter(a =>
      a.isActive && (a.role.isHighPrivilege || a.lifecycleStage === 'recertification-due')
    ).slice(0, 28)
    return highPriv.map(a => {
      const { rec, reason } = getRecommendation(a)
      return { assignment: a, decision: 'pending', recommendation: rec, recommendationReason: reason }
    })
  })

  const [filter, setFilter] = useState<'all' | 'pending' | 'certify' | 'revoke'>('all')

  const filtered = useMemo(() =>
    items.filter(i => filter === 'all' || i.decision === filter || (filter === 'pending' && i.decision === 'pending')),
    [items, filter]
  )

  const stats = {
    pending: items.filter(i => i.decision === 'pending').length,
    certified: items.filter(i => i.decision === 'certify').length,
    revoked: items.filter(i => i.decision === 'revoke').length,
    autoRevoke: items.filter(i => i.recommendation === 'revoke').length,
    autoCertify: items.filter(i => i.recommendation === 'certify').length,
  }

  // Campaign progress reflects actual decisions made
  const completedCount = stats.certified + stats.revoked
  const activeCampaignProgress = {
    ...selectedCampaign,
    completedItems: selectedCampaign.status === 'completed'
      ? selectedCampaign.completedItems
      : Math.min(selectedCampaign.totalItems, selectedCampaign.completedItems + completedCount),
  }

  function decide(id: string, decision: ReviewDecision) {
    setItems(prev => prev.map(i => i.assignment.id === id ? { ...i, decision } : i))
  }

  function applyAllRecommendations() {
    setItems(prev => prev.map(i =>
      i.decision === 'pending' ? { ...i, decision: i.recommendation === 'certify' ? 'certify' : i.recommendation === 'revoke' ? 'revoke' : 'pending' } : i
    ))
  }

  const recColors = { certify: 'text-green-600', revoke: 'text-red-600', review: 'text-orange-600' }
  const recIcons = { certify: '✅', revoke: '🗑️', review: '⚠️' }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Access Review Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Periodic certification — certify or revoke each access item</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium">
          + New Campaign
        </button>
      </div>

      {/* Campaign list */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {mockCampaigns.map(camp => {
          const displayCamp = camp.id === selectedCampaign.id ? activeCampaignProgress : camp
          return (
          <button key={camp.id} onClick={() => setSelectedCampaign(camp)}
            className={`text-left p-4 rounded-xl border shadow-sm transition-all ${
              selectedCampaign.id === camp.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
            <div className="flex items-start justify-between mb-2">
              <div className="text-sm font-semibold text-gray-900 leading-tight">{camp.name}</div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${
                camp.status === 'active' ? 'bg-green-100 text-green-700' :
                camp.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                'bg-yellow-100 text-yellow-700'
              }`}>{camp.status}</span>
            </div>
            <div className="text-xs text-gray-500 mb-2">{camp.type} · {camp.startDate} → {camp.endDate}</div>
            <ProgressBar value={displayCamp.completedItems} total={displayCamp.totalItems}
              color={camp.status === 'completed' ? 'bg-green-500' : 'bg-indigo-500'} />
          </button>
          )
        })}
      </div>

      {/* Campaign detail */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">{activeCampaignProgress.name}</h2>
            <div className="text-xs text-gray-400 mt-0.5">{activeCampaignProgress.scope} · {activeCampaignProgress.completedItems}/{activeCampaignProgress.totalItems} decisions made</div>
          </div>
          <div className="flex gap-2">
            <button onClick={applyAllRecommendations}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs rounded-lg hover:bg-indigo-100 font-medium border border-indigo-200">
              🤖 Apply AI Recommendations
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-0 border-b border-gray-100">
          {[
            { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
            { label: 'Certified', value: stats.certified, color: 'text-green-600' },
            { label: 'Revoked', value: stats.revoked, color: 'text-red-600' },
            { label: 'AI: Certify', value: stats.autoCertify, color: 'text-blue-600' },
            { label: 'AI: Revoke', value: stats.autoRevoke, color: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="px-4 py-3 text-center border-r border-gray-100 last:border-0">
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-4 pt-3 border-b border-gray-100">
          {(['all', 'pending', 'certify', 'revoke'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg capitalize transition-colors ${
                filter === f ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {f} {f !== 'all' && `(${items.filter(i => f === 'pending' ? i.decision === 'pending' : i.decision === f).length})`}
            </button>
          ))}
        </div>

        {/* Review items */}
        <div className="divide-y divide-gray-50">
          {filtered.slice(0, 20).map(item => {
            const a = item.assignment
            const principalName = a.enterpriseUser?.displayName ?? a.consumer?.username ?? a.principalId
            return (
              <div key={a.id} className="px-5 py-3 flex items-center gap-4">
                {/* Principal */}
                <div className="w-48 flex-shrink-0">
                  <div className="text-xs font-medium text-gray-900 truncate">{principalName}</div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {a.enterpriseUser?.department ?? a.consumer?.system}
                  </div>
                </div>

                {/* Role */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {a.role.isHighPrivilege && <span>🔐</span>}
                    <span className="text-xs font-medium text-gray-800 truncate">{a.role.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-medium text-white px-1.5 py-0.5 rounded-full"
                      style={{ background: SYSTEM_COLORS[a.role.system] }}>
                      {SYSTEM_LABELS[a.role.system]}
                    </span>
                    <Badge value={a.role.privilegeLevel} variant="privilege" />
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="w-48 flex-shrink-0">
                  <div className={`text-xs font-medium ${recColors[item.recommendation]}`}>
                    {recIcons[item.recommendation]} AI: {item.recommendation.toUpperCase()}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 leading-tight">{item.recommendationReason}</div>
                </div>

                {/* Decision buttons */}
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={() => decide(a.id, 'certify')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      item.decision === 'certify'
                        ? 'bg-green-600 text-white'
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    }`}>
                    ✓ Certify
                  </button>
                  <button onClick={() => decide(a.id, 'revoke')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      item.decision === 'revoke'
                        ? 'bg-red-600 text-white'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    }`}>
                    ✗ Revoke
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length > 20 && (
          <div className="px-5 py-3 text-xs text-gray-400 border-t border-gray-100">
            Showing 20 of {filtered.length} items
          </div>
        )}
      </div>
    </div>
  )
}
