import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { mockEnterpriseUsers } from '../mock/mockEnterpriseUsers'
import { mockConsumers } from '../mock/mockConsumers'
import { mockRoleAssignments } from '../mock/mockRoleAssignments'
import type { RoleAssignment, SystemType, Consumer } from '../types/domain'
import { Badge } from '../components/ui/Badge'
import { SYSTEM_COLORS, SYSTEM_LABELS } from '../utils/buildGraphData'
import { computeRiskScore, getRiskBg } from '../utils/riskScoreEngine'
import { LiveDataBadge } from '../components/ui/LiveDataBadge'
import { useKongRoleAssignments, useKongPrincipals } from '../hooks/useKongData'

const SYSTEMS: SystemType[] = ['kong', 'azure-ad', 'sap-btp', 'ado-pipelines']

// ─── SystemAccessCard ─────────────────────────────────────────────────────────

function SystemAccessCard({ system, assignments }: { system: SystemType; assignments: RoleAssignment[] }) {
  const active = assignments.filter(a => a.isActive)
  const inactive = assignments.filter(a => !a.isActive)
  const highPriv = active.filter(a => a.role.isHighPrivilege)
  const sodConflicts = active.filter(a => a.role.sodConflicts.length > 0)

  if (assignments.length === 0) {
    return (
      <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 rounded-full" style={{ background: SYSTEM_COLORS[system] }} />
          <span className="text-sm font-semibold text-gray-400">{SYSTEM_LABELS[system]}</span>
        </div>
        <div className="text-xs text-gray-400">No access</div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: SYSTEM_COLORS[system] }} />
          <span className="text-sm font-semibold text-gray-800">{SYSTEM_LABELS[system]}</span>
        </div>
        <div className="flex gap-1.5">
          {highPriv.length > 0 && (
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full">
              🔐 {highPriv.length} high-priv
            </span>
          )}
          {sodConflicts.length > 0 && (
            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
              ⚠️ {sodConflicts.length} SoD
            </span>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {active.map(a => (
          <div key={a.id} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-1.5">
              {a.role.isHighPrivilege && <span>🔐</span>}
              {a.role.sodConflicts.length > 0 && <span>⚠️</span>}
              <span className="font-medium text-gray-800">{a.role.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge value={a.role.privilegeLevel} variant="privilege" />
              <Badge value={a.severity} variant="severity" />
              <span className="text-gray-400 capitalize">{a.role.environment}</span>
              {a.expiresAt && (
                <span className="text-orange-600 font-medium">exp {a.expiresAt.split('T')[0]}</span>
              )}
              {a.lifecycleStage === 'recertification-due' && (
                <span className="text-orange-500 text-[10px] bg-orange-50 px-1 py-0.5 rounded">recert due</span>
              )}
            </div>
          </div>
        ))}
        {inactive.length > 0 && (
          <div className="text-xs text-gray-400 pt-1">
            {inactive.length} revoked/inactive assignment{inactive.length > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function UserAccessProfilePage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  // Live Kong data
  const kongAssignments = useKongRoleAssignments()
  const kongPrincipals = useKongPrincipals()

  // Merge live Kong consumers with mock consumers for other systems
  const consumers: Consumer[] = kongPrincipals.liveConsumers
    ? [
        ...kongPrincipals.liveConsumers,
        ...mockConsumers.filter(c => c.system !== 'kong'),
      ]
    : mockConsumers

  // Merge live Kong assignments with mock assignments for other systems
  const allAssignments = useMemo(() => {
    if (!kongAssignments.isLive) return mockRoleAssignments
    const nonKong = mockRoleAssignments.filter(a => a.role.system !== 'kong')
    return [...kongAssignments.data, ...nonKong]
  }, [kongAssignments.isLive, kongAssignments.data])

  // Build principal list: enterprise users + consumers (live Kong + mock others)
  const allPrincipals = useMemo(() => [
    ...mockEnterpriseUsers.map(u => ({
      id: u.id,
      label: u.displayName,
      sub: u.jobTitle,
      type: 'enterprise-user' as const,
      status: u.status,
    })),
    ...consumers.slice(0, 20).map(c => ({
      id: c.id,
      label: c.username,
      sub: c.system,
      type: 'consumer' as const,
      status: undefined as string | undefined,
    })),
  ], [consumers])

  const [selectedUserId, setSelectedUserId] = useState<string>(
    userId ?? mockEnterpriseUsers[0].id,
  )

  const selected = allPrincipals.find(p => p.id === selectedUserId) ?? allPrincipals[0]
  const eu = mockEnterpriseUsers.find(u => u.id === selected.id)
  const consumer = consumers.find(c => c.id === selected.id)

  const assignments = useMemo(
    () => allAssignments.filter(a => a.principalId === selected.id),
    [allAssignments, selected.id],
  )

  const computedRisk = eu ? computeRiskScore(eu, allAssignments) : null
  const activeAssignments = assignments.filter(a => a.isActive)
  const totalSystems = new Set(activeAssignments.map(a => a.role.system)).size
  const highPrivCount = activeAssignments.filter(a => a.role.isHighPrivilege).length
  const sodCount = activeAssignments.filter(a => a.role.sodConflicts.length > 0).length
  const expiringCount = activeAssignments.filter(a => a.expiresAt).length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Access Profile</h1>
            <p className="text-sm text-gray-500 mt-0.5">Complete cross-system access view for any principal</p>
          </div>
        </div>
        <LiveDataBadge
          isLive={kongAssignments.isLive}
          isLoading={kongAssignments.state === 'loading'}
          error={kongAssignments.error}
          onRefetch={kongAssignments.refetch}
        />
      </div>

      <div className="flex gap-5 items-start">
        {/* Principal selector */}
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase">Select Principal</span>
            <span className="text-xs text-gray-400">{allPrincipals.length}</span>
          </div>
          <div className="overflow-y-auto max-h-[600px]">
            {allPrincipals.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedUserId(p.id); navigate(`/users/${p.id}`) }}
                className={`w-full text-left px-3 py-2.5 border-b border-gray-50 transition-colors ${
                  selected.id === p.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">{p.type === 'enterprise-user' ? '👤' : '🤖'}</span>
                  <span className="text-xs font-medium text-gray-900 truncate">{p.label}</span>
                  {p.status === 'inactive' && (
                    <span className="text-[9px] bg-gray-200 text-gray-600 px-1 rounded">inactive</span>
                  )}
                  {p.status === 'suspended' && (
                    <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded">suspended</span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 truncate ml-4">{p.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Profile detail */}
        <div className="flex-1 space-y-4">
          {/* Identity card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                  eu ? 'bg-indigo-500' : 'bg-purple-500'
                }`}>
                  {selected.label[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900">{selected.label}</h2>
                    {eu && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        eu.status === 'active' ? 'bg-green-100 text-green-700' :
                        eu.status === 'suspended' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{eu.status}</span>
                    )}
                    {eu && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        eu.userType === 'contractor' ? 'bg-orange-100 text-orange-700' :
                        eu.userType === 'partner' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{eu.userType}</span>
                    )}
                    {consumer && kongAssignments.isLive && consumer.system === 'kong' && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Live — Kong
                      </span>
                    )}
                  </div>
                  {eu && <div className="text-sm text-gray-500">{eu.jobTitle} · {eu.department}</div>}
                  {consumer && (
                    <div className="text-sm text-gray-500">
                      Service Account · {consumer.system}
                      {consumer.customId && (
                        <span className="ml-2 font-mono text-xs text-gray-400">({consumer.customId})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {computedRisk && (
                <div className="text-right">
                  <div className="text-xs text-gray-400 mb-1">Risk Score</div>
                  <div className={`text-2xl font-bold ${
                    computedRisk.total >= 8 ? 'text-red-600' :
                    computedRisk.total >= 5 ? 'text-orange-500' : 'text-green-600'
                  }`}>
                    {computedRisk.total}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold mt-1 inline-block ${getRiskBg(computedRisk.total)}`}>
                    {computedRisk.level}
                  </span>
                  <div className="text-[10px] text-gray-400 mt-1 max-w-[120px] text-right">
                    {computedRisk.recommendation.split('.')[0]}
                  </div>
                </div>
              )}
            </div>

            {eu && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 text-sm">
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Manager</div>
                  <div className="text-gray-700 text-xs">{eu.manager}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Joined</div>
                  <div className="text-gray-700 text-xs">{eu.joinedAt.split('T')[0]}</div>
                </div>
                {eu.sponsor && (
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Sponsor</div>
                    <div className="text-gray-700 text-xs">{eu.sponsor}</div>
                  </div>
                )}
                {eu.contractExpiry && (
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Contract Expiry</div>
                    <div className="text-orange-600 text-xs font-medium">{eu.contractExpiry.split('T')[0]}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Active Roles', value: activeAssignments.length, color: 'text-indigo-600' },
              { label: 'Systems', value: totalSystems, color: 'text-gray-700' },
              { label: 'High-Privilege', value: highPrivCount, color: highPrivCount > 0 ? 'text-purple-600' : 'text-gray-400' },
              { label: 'SoD Conflicts', value: sodCount, color: sodCount > 0 ? 'text-red-600' : 'text-gray-400' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-center shadow-sm">
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Access by system */}
          {(eu || consumer) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Access by System</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SYSTEMS.map(sys => (
                  <SystemAccessCard
                    key={sys}
                    system={sys}
                    assignments={assignments.filter(a => a.role.system === sys)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Orphaned account alert */}
          {eu && (eu.status === 'inactive' || eu.status === 'suspended') && activeAssignments.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-red-500 text-xl">🚨</span>
                <div>
                  <div className="font-semibold text-red-800 text-sm">Orphaned Account Alert</div>
                  <div className="text-red-700 text-xs mt-1">
                    This user is <strong>{eu.status}</strong> but still has{' '}
                    <strong>{activeAssignments.length} active role assignment{activeAssignments.length > 1 ? 's' : ''}</strong>{' '}
                    across {totalSystems} system{totalSystems > 1 ? 's' : ''}. Immediate revocation is recommended.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Expiring access */}
          {expiringCount > 0 && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-orange-500 text-xl">⏰</span>
                <div>
                  <div className="font-semibold text-orange-800 text-sm">Expiring Access</div>
                  <div className="space-y-1 mt-2">
                    {activeAssignments.filter(a => a.expiresAt).map(a => (
                      <div key={a.id} className="text-xs text-orange-700 flex items-center gap-2">
                        <span className="font-medium">{a.role.name}</span>
                        <span className="text-gray-400">({SYSTEM_LABELS[a.role.system]})</span>
                        <span>→ expires {a.expiresAt!.split('T')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
