import type { ConnectorStatus } from '../../types/domain'
import type { ConnectorStatusExtended } from '../../hooks/useKongData'
import { StatusDot } from '../ui/StatusDot'

interface ConnectorHealthCardProps {
  status: ConnectorStatus | ConnectorStatusExtended
  name?: string
}

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function isExtended(s: ConnectorStatus | ConnectorStatusExtended): s is ConnectorStatusExtended {
  return 'version' in s || 'activeConnections' in s
}

export function ConnectorHealthCard({ status, name }: ConnectorHealthCardProps) {
  const isUnhealthy = status.health !== 'healthy'
  const title = name ?? `${status.system} Connector`
  const ext = isExtended(status) ? status : null

  return (
    <div className={`bg-white rounded-xl border ${isUnhealthy ? 'border-red-200' : 'border-gray-200'} p-5 shadow-sm`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          {ext?.version && (
            <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
              v{ext.version} · {ext.hostname}
            </div>
          )}
        </div>
        <StatusDot health={status.health} showLabel />
      </div>

      {/* Error message */}
      {isUnhealthy && status.errorMessage && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          ⚠️ {status.errorMessage}
        </div>
      )}

      {/* Core metrics */}
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span className="text-gray-400">Last sync</span>
          <span className="font-medium">{formatRelativeTime(status.lastSyncAt)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Duration</span>
          <span className="font-medium">{status.lastSyncDurationMs}ms</span>
        </div>
        {status.pendingSyncItems > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Pending items</span>
            <span className="font-medium text-orange-600">{status.pendingSyncItems}</span>
          </div>
        )}

        {/* Live server metrics — only shown when connected to real Kong */}
        {ext?.activeConnections !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-400">Active connections</span>
            <span className="font-medium">{ext.activeConnections}</span>
          </div>
        )}
        {ext?.totalRequests !== undefined && (
          <div className="flex justify-between">
            <span className="text-gray-400">Total requests</span>
            <span className="font-medium">{ext.totalRequests.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Live indicator */}
      {ext?.version && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-green-600 font-medium">Live — Kong Admin API</span>
        </div>
      )}
    </div>
  )
}
