import { useState, useMemo } from 'react'
import { mockRoleAssignments } from '../mock/mockRoleAssignments'
import { mockLifecycleShowcaseAssignments } from '../mock/mockRoleAssignments'
import { mockLifecycleEvents } from '../mock/mockLifecycleEvents'
import type { RoleAssignment, RoleLifecycleEvent, LifecycleStage, SystemType } from '../types/domain'
import { Badge } from '../components/ui/Badge'
import { SYSTEM_COLORS, SYSTEM_LABELS } from '../utils/buildGraphData'

// ─── Stage metadata ───────────────────────────────────────────────────────────

const STAGE_META: Record<LifecycleStage, { label: string; color: string; icon: string }> = {
  'requested':            { label: 'Requested',            color: 'bg-blue-500',    icon: '📝' },
  'risk-evaluated':       { label: 'Risk Evaluated',       color: 'bg-indigo-500',  icon: '🔍' },
  'pending-approval':     { label: 'Pending Approval',     color: 'bg-yellow-500',  icon: '⏳' },
  'approved':             { label: 'Approved',             color: 'bg-green-500',   icon: '✅' },
  'provisioned':          { label: 'Provisioned',          color: 'bg-teal-500',    icon: '⚙️' },
  'active':               { label: 'Active',               color: 'bg-emerald-500', icon: '🟢' },
  'recertification-due':  { label: 'Recertification Due',  color: 'bg-orange-500',  icon: '🔄' },
  'revoke-requested':     { label: 'Revoke Requested',     color: 'bg-red-400',     icon: '🚫' },
  'deprovisioned':        { label: 'Deprovisioned',        color: 'bg-gray-500',    icon: '🗑️' },
  'expired':              { label: 'Expired',              color: 'bg-gray-400',    icon: '⌛' },
  'rejected':             { label: 'Rejected',             color: 'bg-red-600',     icon: '❌' },
  'failed':               { label: 'Failed',               color: 'bg-red-700',     icon: '💥' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function principalLabel(a: RoleAssignment): string {
  return a.enterpriseUser?.displayName ?? a.consumer?.username ?? a.principalId
}

function principalSubLabel(a: RoleAssignment): string {
  if (a.enterpriseUser) return `${a.enterpriseUser.jobTitle} · ${a.enterpriseUser.department}`
  return a.consumer?.system ?? ''
}

function formatTs(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function durationBetween(a: string, b: string): string {
  const ms = new Date(b).getTime() - new Date(a).getTime()
  const h = Math.floor(ms / 3600000)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SystemPill({ system }: { system: SystemType }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ background: SYSTEM_COLORS[system] }}
    >
      {SYSTEM_LABELS[system]}
    </span>
  )
}

function LifecycleTimeline({ events }: { events: RoleLifecycleEvent[] }) {
  const sorted = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

      <div className="space-y-0">
        {sorted.map((ev, idx) => {
          const meta = STAGE_META[ev.stage]
          const next = sorted[idx + 1]
          const duration = next ? durationBetween(ev.timestamp, next.timestamp) : null

          return (
            <div key={ev.id} className="relative flex gap-4">
              {/* Node */}
              <div className="relative z-10 flex-shrink-0 w-10 flex flex-col items-center">
                <div className={`w-6 h-6 rounded-full ${meta.color} flex items-center justify-center text-xs shadow-sm mt-3`}>
                  <span className="text-[10px]">{meta.icon}</span>
                </div>
                {duration && (
                  <div className="text-[9px] text-gray-400 mt-1 whitespace-nowrap">{duration}</div>
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-4 ${idx === sorted.length - 1 ? '' : ''}`}>
                <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-sm mt-2">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold text-white px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                      <SystemPill system={ev.system} />
                      {ev.automated && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">🤖 automated</span>
                      )}
                    </div>
                    {ev.riskScore !== undefined && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        ev.riskScore >= 80 ? 'bg-red-100 text-red-700' :
                        ev.riskScore >= 50 ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        Risk {ev.riskScore}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-1">{ev.details}</p>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span>👤 {ev.actor}</span>
                    <span>🕐 {formatTs(ev.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function RoleLifecyclePage() {
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null)
  const [filterPrincipalType, setFilterPrincipalType] = useState<'all' | 'enterprise-user' | 'consumer'>('all')
  const [filterSystem, setFilterSystem] = useState<SystemType | 'all'>('all')
  const [filterStage, setFilterStage] = useState<LifecycleStage | 'all'>('all')
  const [search, setSearch] = useState('')

  // All assignments with lifecycle events — showcase assignments first so all stages are visible
  const assignmentsWithEvents = useMemo(() => {
    const ids = new Set(mockLifecycleEvents.map(e => e.assignmentId))
    const regular = mockRoleAssignments.filter(a => ids.has(a.id))
    const showcase = mockLifecycleShowcaseAssignments.filter(a => ids.has(a.id))
    // Deduplicate — showcase takes priority
    const showcaseIds = new Set(showcase.map(a => a.id))
    return [...showcase, ...regular.filter(a => !showcaseIds.has(a.id))]
  }, [])

  const filtered = useMemo(() => {
    return assignmentsWithEvents.filter(a => {
      if (filterPrincipalType !== 'all' && a.principalType !== filterPrincipalType) return false
      if (filterSystem !== 'all' && a.role.system !== filterSystem) return false
      if (filterStage !== 'all' && a.lifecycleStage !== filterStage) return false
      if (search) {
        const label = principalLabel(a).toLowerCase()
        const role = a.role.name.toLowerCase()
        if (!label.includes(search.toLowerCase()) && !role.includes(search.toLowerCase())) return false
      }
      return true
    })
  }, [assignmentsWithEvents, filterPrincipalType, filterSystem, filterStage, search])

  const selectedAssignment = filtered.find(a => a.id === selectedAssignmentId) ?? filtered[0] ?? null
  const selectedEvents = selectedAssignment
    ? mockLifecycleEvents.filter(e => e.assignmentId === selectedAssignment.id)
    : []

  // Stats
  const stats = useMemo(() => ({
    total: assignmentsWithEvents.length,
    active: assignmentsWithEvents.filter(a => a.lifecycleStage === 'active').length,
    recertDue: assignmentsWithEvents.filter(a => a.lifecycleStage === 'recertification-due').length,
    deprovisioned: assignmentsWithEvents.filter(a => a.lifecycleStage === 'deprovisioned').length,
    enterpriseUsers: assignmentsWithEvents.filter(a => a.principalType === 'enterprise-user').length,
    consumers: assignmentsWithEvents.filter(a => a.principalType === 'consumer').length,
  }), [assignmentsWithEvents])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Role Lifecycle</h1>
        <p className="text-sm text-gray-500 mt-1">
          End-to-end lifecycle timeline for every role assignment across all connected systems
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total',          value: stats.total,          color: 'text-gray-700' },
          { label: 'Active',         value: stats.active,         color: 'text-emerald-600' },
          { label: 'Recert Due',     value: stats.recertDue,      color: 'text-orange-600' },
          { label: 'Deprovisioned',  value: stats.deprovisioned,  color: 'text-gray-400' },
          { label: 'Enterprise Users', value: stats.enterpriseUsers, color: 'text-teal-600' },
          { label: 'Consumers',      value: stats.consumers,      color: 'text-indigo-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-center shadow-sm">
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-4 items-start">
        {/* Left: assignment list */}
        <div className="w-72 flex-shrink-0 space-y-3">
          {/* Filters */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 space-y-3">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search user or role…"
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={filterPrincipalType}
              onChange={e => setFilterPrincipalType(e.target.value as typeof filterPrincipalType)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All principal types</option>
              <option value="enterprise-user">Enterprise Users</option>
              <option value="consumer">Consumers</option>
            </select>
            <select
              value={filterSystem}
              onChange={e => setFilterSystem(e.target.value as typeof filterSystem)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All systems</option>
              <option value="kong">Kong API GW</option>
              <option value="azure-ad">Azure AD</option>
              <option value="sap-btp">SAP BTP</option>
              <option value="ado-pipelines">ADO Pipelines</option>
            </select>
            <select
              value={filterStage}
              onChange={e => setFilterStage(e.target.value as typeof filterStage)}
              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All stages</option>
              {(Object.keys(STAGE_META) as LifecycleStage[]).map(s => (
                <option key={s} value={s}>{STAGE_META[s].label}</option>
              ))}
            </select>
          </div>

          {/* Assignment list */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 text-xs text-gray-500 font-medium">
              {filtered.length} assignments
            </div>
            <div className="overflow-y-auto max-h-[520px]">
              {filtered.length === 0 ? (
                <div className="p-4 text-xs text-gray-400 text-center">No assignments match filters.</div>
              ) : (
                filtered.map(a => {
                  const isSelected = (selectedAssignment?.id ?? filtered[0]?.id) === a.id
                  const stageMeta = STAGE_META[a.lifecycleStage]
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAssignmentId(a.id)}
                      className={`w-full text-left px-3 py-2.5 border-b border-gray-50 transition-colors ${
                        isSelected ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-medium text-gray-900 truncate">
                              {a.principalType === 'enterprise-user' ? '👤' : '🤖'} {principalLabel(a)}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-400 truncate">{a.role.name}</div>
                          <div className="flex items-center gap-1 mt-1">
                            <SystemPill system={a.role.system} />
                          </div>
                        </div>
                        <span className={`text-[9px] text-white px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${stageMeta.color}`}>
                          {stageMeta.icon}
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right: timeline detail */}
        <div className="flex-1 min-w-0">
          {selectedAssignment ? (
            <div className="space-y-4">
              {/* Assignment header */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {selectedAssignment.principalType === 'enterprise-user' ? '👤' : '🤖'}
                      </span>
                      <h2 className="text-lg font-bold text-gray-900">{principalLabel(selectedAssignment)}</h2>
                      {selectedAssignment.enterpriseUser && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          selectedAssignment.enterpriseUser.status === 'active' ? 'bg-green-100 text-green-700' :
                          selectedAssignment.enterpriseUser.status === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {selectedAssignment.enterpriseUser.status}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">{principalSubLabel(selectedAssignment)}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <SystemPill system={selectedAssignment.role.system} />
                    <Badge value={selectedAssignment.role.privilegeLevel} variant="privilege" />
                    <Badge value={selectedAssignment.severity} variant="severity" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Role</div>
                    <div className="font-medium text-gray-800 flex items-center gap-1">
                      {selectedAssignment.role.isHighPrivilege && <span title="High-privilege">🔐</span>}
                      {selectedAssignment.role.name}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Current Stage</div>
                    <span className={`text-xs text-white px-2 py-0.5 rounded-full font-medium ${STAGE_META[selectedAssignment.lifecycleStage].color}`}>
                      {STAGE_META[selectedAssignment.lifecycleStage].label}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Assigned</div>
                    <div className="text-gray-700 text-xs">{selectedAssignment.assignedAt.split('T')[0]}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-0.5">Expires</div>
                    <div className={`text-xs font-medium ${selectedAssignment.expiresAt ? 'text-orange-600' : 'text-gray-400'}`}>
                      {selectedAssignment.expiresAt ? selectedAssignment.expiresAt.split('T')[0] : 'No expiry'}
                    </div>
                  </div>
                </div>

                {selectedAssignment.role.description && (
                  <div className="mt-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                    {selectedAssignment.role.description}
                  </div>
                )}

                {/* Enterprise user cross-system summary */}
                {selectedAssignment.enterpriseUser && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-400 mb-2">Systems with access</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAssignment.enterpriseUser.systems.map(sys => (
                        <SystemPill key={sys} system={sys} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">
                  Lifecycle Timeline
                  <span className="ml-2 text-gray-400 font-normal">({selectedEvents.length} events)</span>
                </h3>
                <LifecycleTimeline events={selectedEvents} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center h-64">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">📋</div>
                <div className="text-sm">Select an assignment to view its lifecycle</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
