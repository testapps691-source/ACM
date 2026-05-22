import type { ConnectorHealth } from '../../types/domain'

interface StatusDotProps {
  health: ConnectorHealth
  showLabel?: boolean
}

const colorMap: Record<ConnectorHealth, string> = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  unhealthy: 'bg-red-500',
}

export function StatusDot({ health, showLabel = false }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block w-2.5 h-2.5 rounded-full ${colorMap[health]}`}
        aria-label={`Connector health: ${health}`}
      />
      {showLabel && (
        <span className="text-sm capitalize text-gray-700">{health}</span>
      )}
    </span>
  )
}
