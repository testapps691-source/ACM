import type { AuditLogEntry, AuditOperationType } from '../types/domain'

const actors = ['alice@acme.com', 'bob@acme.com', 'carol@acme.com', 'dave@acme.com', 'eve@acme.com', 'system']
const opTypes: AuditOperationType[] = [
  'role_assignment_created', 'role_assignment_activated', 'role_assignment_failed',
  'role_assignment_revoked', 'approval_submitted', 'approval_approved', 'approval_rejected',
  'approval_escalated', 'config_updated', 'sod_policy_updated',
  'connector_sync_completed', 'connector_health_changed',
]
const resourceTypes = ['RoleAssignment', 'ApprovalRequest', 'ConnectorConfig', 'SodPolicy', 'Connector']

function makeEntry(i: number, daysAgo: number, opType: AuditOperationType): AuditLogEntry {
  const ts = new Date('2026-05-05T12:00:00Z')
  ts.setDate(ts.getDate() - daysAgo)
  ts.setMinutes(ts.getMinutes() - (i * 7))
  return {
    id: `audit-${i + 1}`,
    timestamp: ts.toISOString(),
    actor: actors[i % actors.length],
    operationType: opType,
    resourceId: `res-${(i % 20) + 1}`,
    resourceType: resourceTypes[i % resourceTypes.length],
    details: `${opType.replace(/_/g, ' ')} performed on resource res-${(i % 20) + 1}`,
  }
}

export const mockAuditLog: AuditLogEntry[] = Array.from({ length: 100 }, (_, i) =>
  makeEntry(i, Math.floor(i / 3), opTypes[i % opTypes.length])
)
