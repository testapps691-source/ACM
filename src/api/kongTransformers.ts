// ─── Kong API → Domain Type Transformers ─────────────────────────────────────
// Maps raw Kong Admin API responses to the domain types used throughout the app.

import type {
  Consumer,
  Role,
  RoleAssignment,
  ConnectorStatus,
  ConnectorRegistryEntry,
  SodConflict,
  AuditLogEntry,
  AuditOperationType,
} from '../types/domain'
import type { KongConsumer, KongAcl, KongNodeStatus, KongNodeInfo } from './kongClient'

// ─── Consumer ─────────────────────────────────────────────────────────────────

export function toConsumer(raw: KongConsumer): Consumer {
  return {
    id: raw.id,
    username: raw.username,
    customId: raw.custom_id,
    // Kong doesn't expose environment natively — infer from tags or username suffix
    environment: inferEnvironment(raw.username, raw.tags),
    system: 'kong',
  }
}

function inferEnvironment(
  username: string,
  tags?: string[],
): 'production' | 'staging' | 'development' {
  const tagEnv = tags?.find(t => ['production', 'staging', 'development'].includes(t))
  if (tagEnv) return tagEnv as 'production' | 'staging' | 'development'
  if (username.endsWith('-stg') || username.endsWith('-staging')) return 'staging'
  if (username.endsWith('-dev') || username.endsWith('-development')) return 'development'
  return 'production'
}

// ─── Role (from ACL group) ────────────────────────────────────────────────────

/**
 * Derives a Role from a Kong ACL group name.
 * Kong doesn't have a native "role" concept — ACL groups serve as roles.
 */
export function aclGroupToRole(
  aclGroup: string,
  assignmentCount: number,
  environment: 'production' | 'staging' | 'development' = 'production',
): Role {
  const isHighPrivilege =
    aclGroup.includes('admin') ||
    aclGroup.includes('super') ||
    aclGroup.includes('config')

  const privilegeLevel = isHighPrivilege
    ? 'high-privilege'
    : aclGroup.includes('write') || aclGroup.includes('processor')
    ? 'elevated'
    : 'standard'

  return {
    id: `kong-acl-${aclGroup}`,
    name: aclGroup,
    aclGroup,
    privilegeLevel,
    owner: null,
    isHighPrivilege,
    assignmentCount,
    environment,
    sodConflicts: [] as SodConflict[],
    system: 'kong',
    description: `Kong ACL group: ${aclGroup}`,
  }
}

// ─── Role Assignments (from consumer + ACLs) ──────────────────────────────────

export function toRoleAssignments(
  consumer: Consumer,
  acls: KongAcl[],
  aclGroupCounts: Map<string, number>,
): RoleAssignment[] {
  return acls.map(acl => {
    const role = aclGroupToRole(
      acl.group,
      aclGroupCounts.get(acl.group) ?? 1,
      consumer.environment,
    )
    return {
      id: `kong-ra-${consumer.id}-${acl.id}`,
      principalId: consumer.id,
      principalType: 'consumer' as const,
      consumer,
      role,
      severity: role.isHighPrivilege ? 'high' : role.privilegeLevel === 'elevated' ? 'medium' : 'low',
      assignedAt: new Date(acl.created_at * 1000).toISOString(),
      approvedBy: '',
      isActive: true,
      lifecycleStage: 'active' as const,
    }
  })
}

// ─── Connector Status ─────────────────────────────────────────────────────────

export function toConnectorStatus(
  status: KongNodeStatus,
  lastSyncAt: string,
  lastSyncDurationMs: number,
): ConnectorStatus {
  const isReachable = status.database?.reachable !== false
  return {
    health: isReachable ? 'healthy' : 'unhealthy',
    lastSyncAt,
    lastSyncDurationMs,
    pendingSyncItems: 0,
    errorMessage: isReachable ? undefined : 'Kong database unreachable',
    system: 'kong',
  }
}

// ─── Connector Registry Entry ─────────────────────────────────────────────────

export function toConnectorRegistryEntry(
  info: KongNodeInfo,
  status: KongNodeStatus,
  baseUrl: string,
  consumerCount: number,
  aclGroupCount: number,
  lastSyncAt: string,
  lastSyncDurationMs: number,
): ConnectorRegistryEntry {
  const isReachable = status.database?.reachable !== false
  return {
    id: 'conn-kong',
    name: 'Kong API Gateway',
    system: 'kong',
    connectorType: 'built-in',
    version: info.version,
    baseUrl,
    authType: 'API Key',
    status: isReachable ? 'healthy' : 'unhealthy',
    lastSyncAt,
    lastSyncDurationMs,
    entityCount: consumerCount,
    roleCount: aclGroupCount,
    ownerTeam: 'Platform Engineering',
    slaTier: 'P1',
    pendingSyncItems: 0,
    errorRate: 0,
    p95LatencyMs: lastSyncDurationMs,
    errorMessage: isReachable ? undefined : 'Kong database unreachable',
  }
}

// ─── Audit Log (derived from Kong sync events) ────────────────────────────────

/**
 * Builds an audit log from Kong consumer + ACL data.
 * Each consumer creation becomes a role_assignment_created entry.
 * Each ACL group membership becomes a role_assignment_activated entry.
 * The node status check becomes a connector_sync_completed entry.
 */
export function toAuditLog(
  consumers: KongConsumer[],
  aclsByConsumer: { consumer: KongConsumer; acls: KongAcl[] }[],
  nodeInfo: KongNodeInfo,
  syncDurationMs: number,
): AuditLogEntry[] {
  const entries: AuditLogEntry[] = []

  // Connector sync entry — most recent
  entries.push({
    id: `kong-sync-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: 'system',
    operationType: 'connector_sync_completed' as AuditOperationType,
    resourceId: nodeInfo.node_id,
    resourceType: 'Connector',
    details: `Kong Admin API sync completed in ${syncDurationMs}ms — ${consumers.length} consumers, node v${nodeInfo.version} on ${nodeInfo.hostname}`,
    system: 'kong',
  })

  // One entry per ACL assignment
  for (const { consumer, acls } of aclsByConsumer) {
    for (const acl of acls) {
      entries.push({
        id: `kong-acl-${acl.id}`,
        timestamp: new Date(acl.created_at * 1000).toISOString(),
        actor: 'kong-admin',
        operationType: 'role_assignment_activated' as AuditOperationType,
        resourceId: consumer.id,
        resourceType: 'RoleAssignment',
        details: `Consumer "${consumer.username}" added to ACL group "${acl.group}"`,
        system: 'kong',
      })
    }
  }

  // One entry per consumer creation
  for (const consumer of consumers) {
    entries.push({
      id: `kong-consumer-${consumer.id}`,
      timestamp: new Date(consumer.created_at * 1000).toISOString(),
      actor: 'kong-admin',
      operationType: 'role_assignment_created' as AuditOperationType,
      resourceId: consumer.id,
      resourceType: 'Consumer',
      details: `Consumer "${consumer.username}" created${consumer.custom_id ? ` (custom_id: ${consumer.custom_id})` : ''}`,
      system: 'kong',
    })
  }

  // Sort newest first
  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

// ─── Enhanced ConnectorStatus with server metrics ─────────────────────────────

export interface ConnectorStatusExtended extends ConnectorStatus {
  activeConnections?: number
  totalRequests?: number
  version?: string
  hostname?: string
}

export function toConnectorStatusExtended(
  status: KongNodeStatus,
  info: KongNodeInfo,
  lastSyncAt: string,
  lastSyncDurationMs: number,
): ConnectorStatusExtended {
  const isReachable = status.database?.reachable !== false
  return {
    health: isReachable ? 'healthy' : 'unhealthy',
    lastSyncAt,
    lastSyncDurationMs,
    pendingSyncItems: 0,
    errorMessage: isReachable ? undefined : 'Kong database unreachable',
    system: 'kong',
    activeConnections: status.server?.connections_active,
    totalRequests: status.server?.total_requests,
    version: info.version,
    hostname: info.hostname,
  }
}

// ─── RBAC Role → Domain Role (EE only) ───────────────────────────────────────

import type { KongRbacRole, KongRbacUser, KongRbacUserRole, KongAuditRequest, KongAuditObject } from './kongClient'

export function rbacRoleToRole(raw: KongRbacRole): Role {
  const isHighPrivilege =
    raw.name.toLowerCase().includes('admin') ||
    raw.name.toLowerCase().includes('super') ||
    raw.is_default === false // non-default roles tend to be custom/elevated

  return {
    id: `kong-rbac-${raw.id}`,
    name: raw.name,
    aclGroup: raw.name,
    privilegeLevel: isHighPrivilege ? 'high-privilege' : 'standard',
    owner: null,
    isHighPrivilege,
    assignmentCount: 0,
    environment: 'production',
    sodConflicts: [] as SodConflict[],
    system: 'kong',
    description: raw.comment ?? `Kong RBAC role: ${raw.name}`,
  }
}

export function rbacUserToConsumer(raw: KongRbacUser): Consumer {
  return {
    id: raw.id,
    username: raw.name,
    environment: 'production',
    system: 'kong',
  }
}

export function rbacUserRoleToAssignment(
  user: KongRbacUser,
  userRole: KongRbacUserRole,
  role: Role,
): RoleAssignment {
  return {
    id: `kong-rbac-ra-${user.id}-${userRole.role.id}`,
    principalId: user.id,
    principalType: 'consumer' as const,
    consumer: rbacUserToConsumer(user),
    role,
    severity: role.isHighPrivilege ? 'high' : 'low',
    assignedAt: new Date(user.created_at * 1000).toISOString(),
    approvedBy: 'kong-admin',
    isActive: user.enabled,
    lifecycleStage: user.enabled ? 'active' : 'deprovisioned',
  }
}

// ─── Real Audit Log (EE) ──────────────────────────────────────────────────────

export function auditRequestsToLog(
  requests: KongAuditRequest[],
  objects: KongAuditObject[],
): AuditLogEntry[] {
  const entries: AuditLogEntry[] = []

  // HTTP request audit entries
  for (const req of requests) {
    const opType: AuditOperationType = req.method === 'DELETE'
      ? 'role_assignment_revoked'
      : req.method === 'POST'
      ? 'role_assignment_created'
      : req.path.includes('config')
      ? 'config_updated'
      : 'connector_sync_completed'

    entries.push({
      id: `kong-req-${req.request_id}`,
      timestamp: new Date(req.created_at * 1000).toISOString(),
      actor: req.rbac_user_id ?? 'kong-admin',
      operationType: opType,
      resourceId: req.request_id,
      resourceType: 'AdminAPIRequest',
      details: `${req.method} ${req.path} → HTTP ${req.status}${req.workspace ? ` [${req.workspace}]` : ''}`,
      system: 'kong',
    })
  }

  // Database object change entries
  for (const obj of objects) {
    const opType: AuditOperationType = obj.operation === 'delete'
      ? 'role_assignment_revoked'
      : obj.operation === 'create'
      ? 'role_assignment_created'
      : 'config_updated'

    entries.push({
      id: `kong-obj-${obj.id}`,
      timestamp: new Date(obj.created_at * 1000).toISOString(),
      actor: obj.rbac_user_id ?? 'system',
      operationType: opType,
      resourceId: obj.entity_key,
      resourceType: obj.dao_name,
      details: `${obj.operation.toUpperCase()} on ${obj.dao_name} (${obj.entity_key})${obj.workspace ? ` in workspace ${obj.workspace}` : ''}`,
      system: 'kong',
    })
  }

  return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}
