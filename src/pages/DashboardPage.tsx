import { useState, useMemo } from 'react'
import type { DashboardFilters, SystemType } from '../types/domain'
import { mockRoleAssignments } from '../mock/mockRoleAssignments'
import { mockRoles } from '../mock/mockRoles'
import { mockApprovalRequests } from '../mock/mockApprovalRequests'
import { connectorStatusBySystem } from '../mock/mockConnectorStatus'
import { mockConnectorRegistry } from '../mock/mockConnectorRegistry'
import { mockAnalytics } from '../mock/mockAnalytics'
import { filterRoleAssignments } from '../utils/dashboardFilters'
import { computeSummaryMetrics } from '../utils/summaryMetrics'
import { SummaryMetricsPanel } from '../components/dashboard/SummaryMetricsPanel'
import { RoleAssignmentTable } from '../components/dashboard/RoleAssignmentTable'
import { ConnectorHealthCard } from '../components/dashboard/ConnectorHealthCard'
import { AnalyticsPanel } from '../components/dashboard/AnalyticsPanel'
import { FilterBar } from '../components/ui/FilterBar'
import { SYSTEM_COLORS, SYSTEM_LABELS } from '../utils/buildGraphData'
import { StatusDot } from '../components/ui/StatusDot'
import { LiveDataBadge } from '../components/ui/LiveDataBadge'
import { useKongConnectorStatus, useKongRoleAssignments } from '../hooks/useKongData'

// ─── System selector ──────────────────────────────────────────────────────────

const SYSTEMS: { id: SystemType | 'all'; label: string; icon: string }[] = [
  { id: 'all',           label: 'All Systems',      icon: '🌐' },
  { id: 'kong',          label: 'Kong API GW',       icon: '⚡' },
  { id: 'azure-ad',      label: 'Azure AD',          icon: '☁️' },
  { id: 'sap-btp',       label: 'SAP BTP',           icon: '🔷' },
  { id: 'ado-pipelines', label: 'ADO Pipelines',     icon: '🔧' },
]

const defaultFilters: DashboardFilters = {
  environment: 'all',
  privilegeLevel: 'all',
  severity: 'all',
  system: 'all',
}

export function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters)

  const selectedSystem = filters.system

  // Live Kong data hooks
  const kongAssignments = useKongRoleAssignments()
  const kongStatus = useKongConnectorStatus()

  // Merge live Kong assignments with mock data for other systems
  const allAssignments = useMemo(() => {
    if (!kongAssignments.isLive) return mockRoleAssignments
    const nonKong = mockRoleAssignments.filter(a => a.role.system !== 'kong')
    return [...kongAssignments.data, ...nonKong]
  }, [kongAssignments.isLive, kongAssignments.data])

  // Filter assignments based on all active filters including system
  const filtered = useMemo(
    () => filterRoleAssignments(allAssignments, filters),
    [allAssignments, filters]
  )

  // Metrics scoped to selected system
  const metrics = useMemo(
    () => computeSummaryMetrics(allAssignments, mockRoles, mockApprovalRequests, selectedSystem),
    [allAssignments, selectedSystem]
  )

  // Connector status — use live for Kong, mock for others
  const connectorStatuses = useMemo(() => {
    if (selectedSystem === 'all') {
      const others = Object.entries(connectorStatusBySystem)
        .filter(([sys]) => sys !== 'kong')
        .map(([, s]) => s)
      return [kongStatus.data, ...others]
    }
    if (selectedSystem === 'kong') return [kongStatus.data]
    return connectorStatusBySystem[selectedSystem] ? [connectorStatusBySystem[selectedSystem]] : []
  }, [selectedSystem, kongStatus.data])

  // Registry entry for selected system header badge
  const registryEntry = useMemo(() => {
    if (selectedSystem === 'all') return null
    return mockConnectorRegistry.find(c => c.system === selectedSystem) ?? null
  }, [selectedSystem])

  function handleFilterChange(id: string, value: string) {
    setFilters(prev => ({ ...prev, [id]: value }))
  }

  function handleClear() {
    setFilters(defaultFilters)
  }

  // Total assignments for the selected system (for the count display)
  const totalForSystem = selectedSystem === 'all'
    ? allAssignments.length
    : allAssignments.filter(a => a.role.system === selectedSystem).length

  const filterConfig = [
    {
      id: 'environment',
      label: 'Environment',
      type: 'select' as const,
      value: filters.environment,
      options: [
        { label: 'All Environments', value: 'all' },
        { label: 'Production', value: 'production' },
        { label: 'Staging', value: 'staging' },
        { label: 'Development', value: 'development' },
      ],
    },
    {
      id: 'privilegeLevel',
      label: 'Privilege Level',
      type: 'select' as const,
      value: filters.privilegeLevel,
      options: [
        { label: 'All Levels', value: 'all' },
        { label: 'Standard', value: 'standard' },
        { label: 'Elevated', value: 'elevated' },
        { label: 'High Privilege', value: 'high-privilege' },
      ],
    },
    {
      id: 'severity',
      label: 'Severity',
      type: 'select' as const,
      value: filters.severity,
      options: [
        { label: 'All Severities', value: 'all' },
        { label: 'Low', value: 'low' },
        { label: 'Medium', value: 'medium' },
        { label: 'High', value: 'high' },
        { label: 'Critical', value: 'critical' },
      ],
    },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Birds-eye view of access state
            {selectedSystem !== 'all'
              ? ` — ${SYSTEM_LABELS[selectedSystem as SystemType]}`
              : ' across all connected systems'}
          </p>
          {(selectedSystem === 'all' || selectedSystem === 'kong') && (
            <div className="mt-2">
              <LiveDataBadge
                isLive={kongAssignments.isLive}
                isLoading={kongAssignments.state === 'loading'}
                error={kongAssignments.error}
                onRefetch={kongAssignments.refetch}
              />
            </div>
          )}
        </div>
        {selectedSystem !== 'all' && registryEntry && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <StatusDot health={registryEntry.status} showLabel />
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-500">{registryEntry.entityCount.toLocaleString()} entities</span>
            <span className="text-xs text-gray-500">·</span>
            <span className="text-xs text-gray-500">{registryEntry.roleCount} roles</span>
          </div>
        )}
      </div>

      {/* System selector tabs */}
      <div className="flex gap-2 flex-wrap">
        {SYSTEMS.map(sys => {
          const isSelected = selectedSystem === sys.id
          const connStatus = sys.id !== 'all' ? connectorStatusBySystem[sys.id] : null
          return (
            <button
              key={sys.id}
              onClick={() => setFilters(prev => ({ ...prev, system: sys.id }))}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span>{sys.icon}</span>
              <span>{sys.label}</span>
              {connStatus && (
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  connStatus.health === 'healthy' ? 'bg-green-500' :
                  connStatus.health === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                }`} title={`Connector: ${connStatus.health}`} />
              )}
              {sys.id !== 'all' && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  isSelected ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {allAssignments.filter(a => a.role.system === sys.id && a.isActive).length}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* KPI cards — scoped to selected system */}
      <SummaryMetricsPanel metrics={metrics} />

      {/* Analytics + Connector health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AnalyticsPanel data={mockAnalytics} />
        </div>
        <div className="space-y-3">
          {connectorStatuses.map(cs => (
            <ConnectorHealthCard
              key={cs.system}
              status={cs}
              name={mockConnectorRegistry.find(c => c.system === cs.system)?.name}
            />
          ))}
          {/* When "All Systems" — show compact summary of all connectors */}
          {selectedSystem === 'all' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Connector Summary</div>
              <div className="space-y-2">
                {mockConnectorRegistry.map(c => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: SYSTEM_COLORS[c.system] }} />
                      <span className="text-gray-700 truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{c.entityCount.toLocaleString()} entities</span>
                      <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                        c.status === 'healthy' ? 'bg-green-100 text-green-700' :
                        c.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role assignment table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Role Assignments
            <span className="ml-2 text-gray-400 font-normal">
              ({filtered.length} of {totalForSystem}
              {selectedSystem !== 'all' && ` in ${SYSTEM_LABELS[selectedSystem as SystemType]}`})
            </span>
          </h2>
          {selectedSystem !== 'all' && (
            <span className="text-xs font-medium text-white px-2 py-0.5 rounded-full"
              style={{ background: SYSTEM_COLORS[selectedSystem as SystemType] }}>
              {SYSTEM_LABELS[selectedSystem as SystemType]}
            </span>
          )}
        </div>
        <div className="p-4 border-b border-gray-100">
          <FilterBar filters={filterConfig} onChange={handleFilterChange} onClear={handleClear} />
        </div>
        <div className="p-4">
          <RoleAssignmentTable assignments={filtered} />
        </div>
      </div>
    </div>
  )
}
