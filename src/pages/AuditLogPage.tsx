import { useState } from 'react'
import type { AuditLogFilters, AuditOperationType } from '../types/domain'
import { filterAuditLog } from '../utils/auditLogFilter'
import { DataTable, type ColumnDef } from '../components/ui/DataTable'
import type { AuditLogEntry } from '../types/domain'
import { LiveDataBadge } from '../components/ui/LiveDataBadge'
import { useKongRealAuditLog } from '../hooks/useKongData'

const ALL_OP_TYPES: AuditOperationType[] = [
  'role_assignment_created', 'role_assignment_activated', 'role_assignment_failed',
  'role_assignment_revoked', 'approval_submitted', 'approval_approved', 'approval_rejected',
  'approval_escalated', 'config_updated', 'sod_policy_updated',
  'connector_sync_completed', 'connector_health_changed',
  'user_onboarded', 'user_offboarded', 'recertification_triggered',
  'lifecycle_stage_changed', 'jit_access_granted', 'jit_access_expired',
]

const PAGE_SIZE = 25

const defaultFilters: AuditLogFilters = {
  startDate: '',
  endDate: '',
  actor: '',
  operationTypes: [],
}

// System badge colours
const SYSTEM_COLORS: Record<string, string> = {
  kong: 'bg-amber-100 text-amber-700',
  'azure-ad': 'bg-blue-100 text-blue-700',
  'sap-btp': 'bg-sky-100 text-sky-700',
  'ado-pipelines': 'bg-purple-100 text-purple-700',
}

export function AuditLogPage() {
  const [filters, setFilters] = useState<AuditLogFilters>(defaultFilters)
  const [page, setPage] = useState(1)

  // Live Kong audit log — falls back to mock when not connected
  const auditLog = useKongRealAuditLog()

  const filtered = filterAuditLog(auditLog.data, filters)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleFilterChange(key: keyof AuditLogFilters, value: string | AuditOperationType[]) {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function handleOpTypeToggle(op: AuditOperationType) {
    const current = filters.operationTypes ?? []
    const next = current.includes(op) ? current.filter(o => o !== op) : [...current, op]
    handleFilterChange('operationTypes', next)
  }

  function handleClear() {
    setFilters(defaultFilters)
    setPage(1)
  }

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp (UTC)',
      render: row => (
        <span className="font-mono text-xs text-gray-600" data-testid="audit-timestamp">
          {row.timestamp.replace('T', ' ').slice(0, 19)}
        </span>
      ),
      sortable: true,
      getValue: row => row.timestamp,
    },
    {
      key: 'actor',
      header: 'Actor',
      render: row => (
        <span className="text-sm text-gray-700" data-testid="audit-actor">{row.actor}</span>
      ),
      sortable: true,
      getValue: row => row.actor,
    },
    {
      key: 'operationType',
      header: 'Operation',
      render: row => (
        <span className="text-xs font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded" data-testid="audit-operation">
          {row.operationType}
        </span>
      ),
      sortable: true,
      getValue: row => row.operationType,
    },
    {
      key: 'system',
      header: 'System',
      render: row => row.system ? (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SYSTEM_COLORS[row.system] ?? 'bg-gray-100 text-gray-600'}`}>
          {row.system}
        </span>
      ) : <span className="text-xs text-gray-300">—</span>,
    },
    {
      key: 'resourceType',
      header: 'Resource',
      render: row => (
        <span className="text-xs text-gray-500">{row.resourceType}</span>
      ),
    },
    {
      key: 'resourceId',
      header: 'Resource ID',
      render: row => (
        <span className="font-mono text-xs text-gray-600 truncate max-w-[120px] block" data-testid="audit-resource-id">
          {row.resourceId}
        </span>
      ),
    },
    {
      key: 'details',
      header: 'Details',
      render: row => (
        <span className="text-xs text-gray-500">{row.details}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">Immutable record of all state-changing operations</p>
          <div className="mt-2 flex items-center gap-2">
            <LiveDataBadge
              isLive={auditLog.isLive}
              isLoading={auditLog.state === 'loading'}
              error={auditLog.error}
              onRefetch={auditLog.refetch}
            />
            {auditLog.isLive && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                auditLog.isEnterprise
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {auditLog.isEnterprise ? '⭐ Enterprise — real audit trail' : 'OSS — derived from sync events'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase">From</label>
            <input
              type="date"
              value={filters.startDate ?? ''}
              onChange={e => handleFilterChange('startDate', e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase">To</label>
            <input
              type="date"
              value={filters.endDate ?? ''}
              onChange={e => handleFilterChange('endDate', e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase">Actor</label>
            <input
              type="text"
              value={filters.actor ?? ''}
              onChange={e => handleFilterChange('actor', e.target.value)}
              placeholder="Filter by actor..."
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleClear} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium pb-1.5">
              Clear filters
            </button>
          </div>
        </div>

        {/* Operation type multi-select */}
        <div>
          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Operation Types</div>
          <div className="flex flex-wrap gap-2">
            {ALL_OP_TYPES.map(op => {
              const active = (filters.operationTypes ?? []).includes(op)
              return (
                <button
                  key={op}
                  onClick={() => handleOpTypeToggle(op)}
                  className={`text-xs px-2 py-1 rounded-md font-mono transition-colors ${
                    active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {op}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500">
        Showing {paginated.length} of {filtered.length} entries
        {filtered.length !== auditLog.data.length && ` (filtered from ${auditLog.data.length} total)`}
      </div>

      {paginated.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-gray-500 mb-2">No audit entries match your filters.</div>
          <button onClick={handleClear} className="text-indigo-600 hover:underline text-sm">
            Clear filters
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={paginated}
          rowKey={r => r.id}
          emptyMessage="No audit entries found."
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
