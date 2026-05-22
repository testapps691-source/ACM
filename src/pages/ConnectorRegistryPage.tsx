import { useState, useEffect } from 'react'
import { mockConnectorRegistry } from '../mock/mockConnectorRegistry'
import type { ConnectorRegistryEntry } from '../types/domain'
import { SYSTEM_COLORS } from '../utils/buildGraphData'
import { StatusDot } from '../components/ui/StatusDot'
import { RegisterConnectorModal } from '../components/connectors/RegisterConnectorModal'
import { LiveDataBadge } from '../components/ui/LiveDataBadge'
import { useKongConnectorRegistry } from '../hooks/useKongData'

// ─── HealthBar ────────────────────────────────────────────────────────────────

function HealthBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: color }}
        />
      </div>
      <span className="text-xs text-gray-600 w-12 text-right">{value}ms</span>
    </div>
  )
}

// ─── SyncToast ────────────────────────────────────────────────────────────────

function SyncToast({ connectorName, onDismiss }: { connectorName: string; onDismiss: () => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
      <svg className="animate-spin w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <span>Syncing <span className="font-medium text-indigo-300">{connectorName}</span>…</span>
      <button onClick={onDismiss} className="ml-2 text-gray-400 hover:text-white text-xs">✕</button>
    </div>
  )
}

// ─── ConnectorCard ────────────────────────────────────────────────────────────

interface ConnectorCardProps {
  entry: ConnectorRegistryEntry
  onSync: (entry: ConnectorRegistryEntry) => void
  onDelete: (id: string) => void
}

function ConnectorCard({ entry, onSync, onDelete }: ConnectorCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isUnhealthy = entry.status !== 'healthy'
  const systemColor = SYSTEM_COLORS[entry.system] ?? '#6366f1'

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
        isUnhealthy ? 'border-orange-200' : 'border-gray-200'
      }`}
    >
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: systemColor }}
            >
              {entry.name[0]}
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">{entry.name}</div>
              <div className="text-xs text-gray-400">{entry.connectorType} · v{entry.version}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusDot health={entry.status} showLabel />
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                entry.slaTier === 'P1'
                  ? 'bg-red-100 text-red-700'
                  : entry.slaTier === 'P2'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {entry.slaTier}
            </span>

            {/* Actions menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Connector actions"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40 text-sm">
                    <button
                      onClick={() => { onSync(entry); setMenuOpen(false) }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                    >
                      <span>🔄</span> Trigger Sync
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false) }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                    >
                      <span>✏️</span> Edit Config
                    </button>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => { onDelete(entry.id); setMenuOpen(false) }}
                      className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                    >
                      <span>🗑</span> Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {entry.errorMessage && (
          <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
            ⚠️ {entry.errorMessage}
          </div>
        )}

        {/* Metrics grid */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          <div>
            <div className="text-gray-400 mb-0.5">Entities</div>
            <div className="font-semibold text-gray-800">{entry.entityCount.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-0.5">Roles</div>
            <div className="font-semibold text-gray-800">{entry.roleCount}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-0.5">Last Sync</div>
            <div className="font-medium text-gray-700">
              {entry.lastSyncDurationMs === 0
                ? 'Pending'
                : `${Math.round((Date.now() - new Date(entry.lastSyncAt).getTime()) / 60000)}m ago`}
            </div>
          </div>
          <div>
            <div className="text-gray-400 mb-0.5">Error Rate</div>
            <div
              className={`font-semibold ${
                entry.errorRate > 1
                  ? 'text-red-600'
                  : entry.errorRate > 0.1
                  ? 'text-orange-500'
                  : 'text-green-600'
              }`}
            >
              {entry.errorRate.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Latency bar */}
        <div className="mb-3">
          <div className="text-xs text-gray-400 mb-1">P95 Latency</div>
          {entry.p95LatencyMs === 0 ? (
            <div className="text-xs text-gray-400 italic">No data yet</div>
          ) : (
            <HealthBar
              value={entry.p95LatencyMs}
              max={1000}
              color={entry.p95LatencyMs > 500 ? '#f97316' : '#10b981'}
            />
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
        >
          {expanded ? '▲ Hide details' : '▼ Show details'}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span className="text-gray-400">Base URL</span>
              <span className="font-mono text-gray-700 truncate max-w-[200px]">{entry.baseUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Auth Type</span>
              <span>{entry.authType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Owner Team</span>
              <span>{entry.ownerTeam}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sync Duration</span>
              <span>{entry.lastSyncDurationMs > 0 ? `${entry.lastSyncDurationMs}ms` : '—'}</span>
            </div>
            {entry.pendingSyncItems > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Pending Items</span>
                <span className="text-orange-600 font-medium">{entry.pendingSyncItems}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ConnectorRegistryPage() {
  const [connectors, setConnectors] = useState<ConnectorRegistryEntry[]>(mockConnectorRegistry)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [syncingConnector, setSyncingConnector] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Live Kong connector data — merges into the registry when available
  const kongRegistry = useKongConnectorRegistry()

  useEffect(() => {
    if (kongRegistry.isLive && kongRegistry.state === 'success') {
      setConnectors(prev =>
        prev.map(c => (c.system === 'kong' ? kongRegistry.data : c)),
      )
    }
  }, [kongRegistry.isLive, kongRegistry.state, kongRegistry.data])

  const healthy = connectors.filter(c => c.status === 'healthy').length
  const degraded = connectors.filter(c => c.status === 'degraded').length
  const totalEntities = connectors.reduce((s, c) => s + c.entityCount, 0)

  function handleRegister(entry: ConnectorRegistryEntry) {
    setConnectors(prev => [...prev, entry])
  }

  function handleSync(entry: ConnectorRegistryEntry) {
    setSyncingConnector(entry.name)
    // If it's the Kong connector and live data is enabled, refetch real status
    if (entry.system === 'kong') {
      kongRegistry.refetch()
    }
    setTimeout(() => setSyncingConnector(null), 3000)
  }

  function handleDelete(id: string) {
    setDeleteConfirm(id)
  }

  function confirmDelete() {
    if (deleteConfirm) {
      setConnectors(prev => prev.filter(c => c.id !== deleteConfirm))
      setDeleteConfirm(null)
    }
  }

  const connectorToDelete = connectors.find(c => c.id === deleteConfirm)

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connector Registry</h1>
          <p className="text-sm text-gray-500 mt-1">
            All connected systems — health, sync status, and entity counts
          </p>
          <div className="mt-2">
            <LiveDataBadge
              isLive={kongRegistry.isLive}
              isLoading={kongRegistry.state === 'loading'}
              error={kongRegistry.error}
              onRefetch={kongRegistry.refetch}
            />
          </div>
        </div>
        <button
          onClick={() => setRegisterOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Register Connector
        </button>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Connectors', value: connectors.length, color: 'text-gray-700' },
          { label: 'Healthy', value: healthy, color: 'text-green-600' },
          { label: 'Degraded', value: degraded, color: degraded > 0 ? 'text-orange-500' : 'text-gray-400' },
          { label: 'Total Entities', value: totalEntities.toLocaleString(), color: 'text-indigo-600' },
        ].map(s => (
          <div
            key={s.label}
            className="bg-white rounded-lg border border-gray-200 px-3 py-2 text-center shadow-sm"
          >
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Connector cards */}
      {connectors.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔌</div>
          <div className="font-medium text-gray-600">No connectors registered</div>
          <div className="text-sm mt-1">Click "Register Connector" to add your first system.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {connectors.map(entry => (
            <ConnectorCard
              key={entry.id}
              entry={entry}
              onSync={handleSync}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Custom connector CTA */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 flex items-center justify-between">
        <div>
          <div className="font-semibold text-indigo-900 text-sm">Add a Custom Connector</div>
          <div className="text-xs text-indigo-700 mt-0.5">
            Any application with a REST API can be governed by ACMP. Build a connector using the SDK
            or YAML descriptor — typically 1–2 weeks.
          </div>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors font-medium flex-shrink-0 ml-4">
          View SDK Docs
        </button>
      </div>

      {/* Register modal */}
      <RegisterConnectorModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegister={handleRegister}
      />

      {/* Sync toast */}
      {syncingConnector && (
        <SyncToast
          connectorName={syncingConnector}
          onDismiss={() => setSyncingConnector(null)}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeleteConfirm(null)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 z-10">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Remove Connector</h3>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to remove{' '}
              <span className="font-medium text-gray-900">{connectorToDelete?.name}</span>? This
              will stop all syncs and remove it from governance coverage.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
