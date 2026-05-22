// ACMP — Domain Types (Multi-System Edition)

// ─── Enumerations ─────────────────────────────────────────────────────────────

export type EnvironmentType   = 'production' | 'staging' | 'development'
export type PrivilegeLevel    = 'standard' | 'elevated' | 'high-privilege'
export type Severity          = 'low' | 'medium' | 'high' | 'critical'
export type ConnectorHealth   = 'healthy' | 'unhealthy' | 'degraded'
export type RequestStatus     = 'pending' | 'approved' | 'rejected' | 'escalated'
export type RequestType       = 'assign' | 'revoke' | 'jit'
export type AuthMethod        = 'api-key' | 'bearer-token'

/** All supported connected systems */
export type SystemType =
  | 'kong'
  | 'azure-ad'
  | 'sap-btp'
  | 'ado-pipelines'
  | 'custom'
  | (string & {})

/** Whether the principal is a human enterprise user or a machine/service consumer */
export type PrincipalType = 'enterprise-user' | 'consumer'

/** Lifecycle stage of a role assignment */
export type LifecycleStage =
  | 'requested'
  | 'risk-evaluated'
  | 'pending-approval'
  | 'approved'
  | 'provisioned'
  | 'active'
  | 'recertification-due'
  | 'revoke-requested'
  | 'deprovisioned'
  | 'expired'
  | 'rejected'
  | 'failed'

/** OPA-style auto-approval decision */
export type AutoApprovalDecision = 'AUTO_APPROVE' | 'MANUAL_APPROVAL' | 'DENY'

/** Connector type classification */
export type ConnectorType = 'built-in' | 'certified' | 'custom'

// ─── Core entities ────────────────────────────────────────────────────────────

export interface SodConflict {
  id: string
  roleA: string
  roleB: string
  classification: string
  detectedAt: string
}

/** A role in any connected system */
export interface Role {
  id: string
  name: string
  aclGroup: string
  privilegeLevel: PrivilegeLevel
  owner: string | null
  isHighPrivilege: boolean
  assignmentCount: number
  environment: EnvironmentType
  sodConflicts: SodConflict[]
  system: SystemType
  description?: string
}

/** Machine / service account (API consumer) */
export interface Consumer {
  id: string
  username: string
  customId?: string
  environment: EnvironmentType
  system: SystemType
}

/** Human enterprise user (employee, contractor, partner) */
export interface EnterpriseUser {
  id: string
  displayName: string
  email: string
  department: string
  jobTitle: string
  manager: string
  systems: SystemType[]
  environment: EnvironmentType
  status: 'active' | 'inactive' | 'suspended'
  userType: 'employee' | 'contractor' | 'partner' | 'service-account'
  joinedAt: string
  riskScore?: number
  sponsor?: string
  contractExpiry?: string
}

// ─── Role Assignment ──────────────────────────────────────────────────────────

export interface RoleAssignment {
  id: string
  principalId: string
  principalType: PrincipalType
  consumer?: Consumer
  enterpriseUser?: EnterpriseUser
  role: Role
  severity: Severity
  assignedAt: string
  approvedBy: string
  isActive: boolean
  expiresAt?: string
  lifecycleStage: LifecycleStage
  lastUsed?: string
  isJit?: boolean
  jitDurationHours?: number
}

// ─── Role Lifecycle ───────────────────────────────────────────────────────────

export interface RoleLifecycleEvent {
  id: string
  assignmentId: string
  stage: LifecycleStage
  timestamp: string
  actor: string
  system: SystemType
  details: string
  riskScore?: number
  automated: boolean
}

// ─── Auto-Approval Policy ─────────────────────────────────────────────────────

export interface PolicyEvaluation {
  decision: AutoApprovalDecision
  riskScore: number
  reasons: string[]
  appliedPolicy?: string
  sodConflicts: SodConflict[]
  evaluatedAt: string
}

// ─── JIT Access Request ───────────────────────────────────────────────────────

export interface JitRequest {
  id: string
  principalId: string
  principalType: PrincipalType
  consumer?: Consumer
  enterpriseUser?: EnterpriseUser
  role: Role
  durationHours: number
  justification: string
  requester: string
  submittedAt: string
  status: 'pending' | 'active' | 'expired' | 'rejected'
  activatedAt?: string
  expiresAt?: string
  approvedBy?: string
  policyEvaluation?: PolicyEvaluation
}

// ─── Connector Registry ───────────────────────────────────────────────────────

export interface ConnectorRegistryEntry {
  id: string
  name: string
  system: SystemType
  connectorType: ConnectorType
  version: string
  baseUrl: string
  authType: string
  status: ConnectorHealth
  lastSyncAt: string
  lastSyncDurationMs: number
  entityCount: number
  roleCount: number
  errorMessage?: string
  ownerTeam: string
  slaTier: 'P1' | 'P2' | 'P3'
  pendingSyncItems: number
  errorRate: number
  p95LatencyMs: number
}

// ─── Approval workflow ────────────────────────────────────────────────────────

export interface ApprovalDecision {
  approver: string
  decision: 'approved' | 'rejected'
  reason?: string
  decidedAt: string
}

export interface ApprovalRequest {
  id: string
  principalId: string
  principalType: PrincipalType
  consumer?: Consumer
  enterpriseUser?: EnterpriseUser
  role: Role
  requestType: RequestType
  requester: string
  submittedAt: string
  status: RequestStatus
  severity: Severity
  sodConflicts: SodConflict[]
  justification: string
  approvers: ApprovalDecision[]
  escalatedAt?: string
  policyEvaluation?: PolicyEvaluation
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export type AuditOperationType =
  | 'role_assignment_created'
  | 'role_assignment_activated'
  | 'role_assignment_failed'
  | 'role_assignment_revoked'
  | 'approval_submitted'
  | 'approval_approved'
  | 'approval_rejected'
  | 'approval_escalated'
  | 'config_updated'
  | 'sod_policy_updated'
  | 'connector_sync_completed'
  | 'connector_health_changed'
  | 'user_onboarded'
  | 'user_offboarded'
  | 'recertification_triggered'
  | 'lifecycle_stage_changed'
  | 'jit_access_granted'
  | 'jit_access_expired'

export interface AuditLogEntry {
  id: string
  timestamp: string
  actor: string
  operationType: AuditOperationType
  resourceId: string
  resourceType: string
  details: string
  system?: SystemType
}

// ─── Connector ────────────────────────────────────────────────────────────────

export interface ConnectorStatus {
  health: ConnectorHealth
  lastSyncAt: string
  lastSyncDurationMs: number
  pendingSyncItems: number
  errorMessage?: string
  system: SystemType
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsDataPoint {
  date: string
  mttr: number
  mttd: number
}

// ─── App config ───────────────────────────────────────────────────────────────

export interface EndpointMapping {
  resource: 'consumers' | 'acls' | 'plugins' | 'users' | 'groups' | 'roles' | 'pipelines'
  path: string
}

export interface KongConfig {
  id: string
  baseUrl: string
  authMethod: AuthMethod
  credential: string
  tlsEnabled: boolean
  endpointMappings: EndpointMapping[]
  savedAt: string
  savedBy: string
}

// ─── Dashboard / filter helpers ───────────────────────────────────────────────

export interface SummaryMetrics {
  highPrivilegeCount: number
  unownedRoleCount: number
  openSodConflictCount: number
  pendingApprovalCount: number
  orphanedAccountCount: number
  jitActiveCount: number
}

export interface DashboardFilters {
  environment: EnvironmentType | 'all'
  privilegeLevel: PrivilegeLevel | 'all'
  severity: Severity | 'all'
  system: SystemType | 'all'
}

export interface AuditLogFilters {
  startDate?: string
  endDate?: string
  actor?: string
  operationTypes?: AuditOperationType[]
}
