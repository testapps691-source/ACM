import type { Severity, PrivilegeLevel, ConnectorHealth, RequestStatus } from '../../types/domain'

type BadgeVariant = 'severity' | 'privilege' | 'status' | 'health' | 'requestType'

interface BadgeProps {
  value: Severity | PrivilegeLevel | ConnectorHealth | RequestStatus | string
  variant: BadgeVariant
  className?: string
}

const severityColors: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

const privilegeColors: Record<string, string> = {
  standard: 'bg-gray-100 text-gray-700',
  elevated: 'bg-blue-100 text-blue-800',
  'high-privilege': 'bg-purple-100 text-purple-800',
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  escalated: 'bg-orange-100 text-orange-800',
}

const healthColors: Record<string, string> = {
  healthy: 'bg-green-100 text-green-800',
  degraded: 'bg-yellow-100 text-yellow-800',
  unhealthy: 'bg-red-100 text-red-800',
}

const requestTypeColors: Record<string, string> = {
  assign: 'bg-blue-100 text-blue-800',
  revoke: 'bg-red-100 text-red-800',
}

function getColor(variant: BadgeVariant, value: string): string {
  switch (variant) {
    case 'severity': return severityColors[value] ?? 'bg-gray-100 text-gray-700'
    case 'privilege': return privilegeColors[value] ?? 'bg-gray-100 text-gray-700'
    case 'status': return statusColors[value] ?? 'bg-gray-100 text-gray-700'
    case 'health': return healthColors[value] ?? 'bg-gray-100 text-gray-700'
    case 'requestType': return requestTypeColors[value] ?? 'bg-gray-100 text-gray-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export function Badge({ value, variant, className = '' }: BadgeProps) {
  const colorClass = getColor(variant, value)
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colorClass} ${className}`}
    >
      {value}
    </span>
  )
}
