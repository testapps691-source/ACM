import type { RoleLifecycleEvent } from '../types/domain'

// Helper to build a lifecycle chain for an assignment
function chain(
  assignmentId: string,
  system: RoleLifecycleEvent['system'],
  baseDate: string,
  includeRevoke = false,
  includeRecert = false,
): RoleLifecycleEvent[] {
  const d = (offsetHours: number) => {
    const dt = new Date(baseDate)
    dt.setHours(dt.getHours() + offsetHours)
    return dt.toISOString()
  }
  const events: RoleLifecycleEvent[] = [
    { id: `${assignmentId}-ev-1`, assignmentId, stage: 'requested',        timestamp: d(0),   actor: 'self-service',              system, details: 'Access request submitted via ACMP portal',                    riskScore: 20,  automated: false },
    { id: `${assignmentId}-ev-2`, assignmentId, stage: 'risk-evaluated',   timestamp: d(1),   actor: 'risk-engine',               system, details: 'Risk engine evaluated request — composite risk score computed', riskScore: 35,  automated: true  },
    { id: `${assignmentId}-ev-3`, assignmentId, stage: 'pending-approval', timestamp: d(1),   actor: 'workflow-engine',           system, details: 'Request routed to approver queue',                             riskScore: 35,  automated: true  },
    { id: `${assignmentId}-ev-4`, assignmentId, stage: 'approved',         timestamp: d(6),   actor: 'approver',                  system, details: 'Request approved by designated approver',                      riskScore: 35,  automated: false },
    { id: `${assignmentId}-ev-5`, assignmentId, stage: 'provisioned',      timestamp: d(7),   actor: 'connector',                 system, details: `Role provisioned in ${system} via REST API`,                   riskScore: 35,  automated: true  },
    { id: `${assignmentId}-ev-6`, assignmentId, stage: 'active',           timestamp: d(7),   actor: 'system',                    system, details: 'Role assignment confirmed active',                             riskScore: 35,  automated: true  },
  ]
  if (includeRecert) {
    events.push({ id: `${assignmentId}-ev-7`, assignmentId, stage: 'recertification-due', timestamp: d(2160), actor: 'scheduler', system, details: 'Quarterly recertification triggered — owner notified', riskScore: 40, automated: true })
  }
  if (includeRevoke) {
    events.push(
      { id: `${assignmentId}-ev-8`, assignmentId, stage: 'revoke-requested',  timestamp: d(4320), actor: 'manager',    system, details: 'Revocation requested by manager',                    riskScore: 0, automated: false },
      { id: `${assignmentId}-ev-9`, assignmentId, stage: 'deprovisioned',     timestamp: d(4326), actor: 'connector',  system, details: `Role removed from ${system} via REST API`,           riskScore: 0, automated: true  },
    )
  }
  return events
}

// High-privilege chain with extra scrutiny steps
function highPrivChain(
  assignmentId: string,
  system: RoleLifecycleEvent['system'],
  baseDate: string,
): RoleLifecycleEvent[] {
  const d = (offsetHours: number) => {
    const dt = new Date(baseDate)
    dt.setHours(dt.getHours() + offsetHours)
    return dt.toISOString()
  }
  return [
    { id: `${assignmentId}-ev-1`, assignmentId, stage: 'requested',        timestamp: d(0),   actor: 'self-service',   system, details: 'High-privilege access request submitted',                          riskScore: 65,  automated: false },
    { id: `${assignmentId}-ev-2`, assignmentId, stage: 'risk-evaluated',   timestamp: d(1),   actor: 'risk-engine',    system, details: 'Risk engine flagged as HIGH — dual approval required',              riskScore: 82,  automated: true  },
    { id: `${assignmentId}-ev-3`, assignmentId, stage: 'pending-approval', timestamp: d(1),   actor: 'workflow-engine',system, details: 'Routed to security officer + standard approver queue',              riskScore: 82,  automated: true  },
    { id: `${assignmentId}-ev-4`, assignmentId, stage: 'approved',         timestamp: d(18),  actor: 'security-officer',system, details: 'First approval: security officer approved',                        riskScore: 82,  automated: false },
    { id: `${assignmentId}-ev-4b`,assignmentId, stage: 'approved',         timestamp: d(24),  actor: 'line-manager',   system, details: 'Second approval: line manager approved (dual-approval satisfied)',  riskScore: 82,  automated: false },
    { id: `${assignmentId}-ev-5`, assignmentId, stage: 'provisioned',      timestamp: d(25),  actor: 'connector',      system, details: `High-privilege role provisioned in ${system}`,                      riskScore: 82,  automated: true  },
    { id: `${assignmentId}-ev-6`, assignmentId, stage: 'active',           timestamp: d(25),  actor: 'system',         system, details: 'Role assignment active — 90-day recertification scheduled',         riskScore: 82,  automated: true  },
    { id: `${assignmentId}-ev-7`, assignmentId, stage: 'recertification-due', timestamp: d(2160), actor: 'scheduler',  system, details: '90-day recertification due — owner and manager notified',           riskScore: 88,  automated: true  },
  ]
}

// Rejected chain
function rejectedChain(
  assignmentId: string,
  system: RoleLifecycleEvent['system'],
  baseDate: string,
): RoleLifecycleEvent[] {
  const d = (offsetHours: number) => {
    const dt = new Date(baseDate)
    dt.setHours(dt.getHours() + offsetHours)
    return dt.toISOString()
  }
  return [
    { id: `${assignmentId}-ev-1`, assignmentId, stage: 'requested',        timestamp: d(0),  actor: 'self-service',   system, details: 'Access request submitted',                                          riskScore: 70, automated: false },
    { id: `${assignmentId}-ev-2`, assignmentId, stage: 'risk-evaluated',   timestamp: d(1),  actor: 'risk-engine',    system, details: 'SoD conflict detected — severity escalated to CRITICAL',             riskScore: 95, automated: true  },
    { id: `${assignmentId}-ev-3`, assignmentId, stage: 'pending-approval', timestamp: d(1),  actor: 'workflow-engine',system, details: 'Routed to security officer due to critical risk score',              riskScore: 95, automated: true  },
    { id: `${assignmentId}-ev-4`, assignmentId, stage: 'rejected',         timestamp: d(8),  actor: 'security-officer',system, details: 'Rejected: SoD conflict with existing role assignment not resolved', riskScore: 95, automated: false },
  ]
}

export const mockLifecycleEvents: RoleLifecycleEvent[] = [
  // Kong consumer assignments
  ...chain('ra-1',  'kong',          '2026-01-10T09:00:00Z'),
  ...chain('ra-2',  'kong',          '2026-01-12T10:00:00Z'),
  ...chain('ra-4',  'kong',          '2026-01-20T08:30:00Z', false, true),
  ...highPrivChain('ra-10', 'kong',  '2026-02-10T10:00:00Z'),
  ...highPrivChain('ra-12', 'kong',  '2026-02-15T08:00:00Z'),
  ...highPrivChain('ra-14', 'kong',  '2026-02-20T10:00:00Z'),

  // SAP BTP
  ...chain('ra-31', 'sap-btp',       '2026-02-01T09:00:00Z'),
  ...chain('ra-32', 'sap-btp',       '2026-02-10T10:00:00Z'),

  // Azure AD
  ...chain('ra-34', 'azure-ad',      '2026-01-15T09:00:00Z'),
  ...highPrivChain('ra-35', 'azure-ad', '2026-01-20T10:00:00Z'),

  // ADO
  ...highPrivChain('ra-37', 'ado-pipelines', '2026-01-10T09:00:00Z'),
  ...chain('ra-38', 'ado-pipelines', '2026-01-15T10:00:00Z'),

  // Enterprise users — Alice Hartmann
  ...highPrivChain('eu-ra-1',  'kong',          '2022-04-01T09:00:00Z'),
  ...chain('eu-ra-2',  'azure-ad',      '2022-04-01T09:00:00Z'),
  ...chain('eu-ra-3',  'ado-pipelines', '2023-01-15T10:00:00Z'),
  ...chain('eu-ra-4',  'kong',          '2022-04-01T09:00:00Z'),

  // Enterprise users — Bob Nakamura
  ...chain('eu-ra-5',  'azure-ad',      '2023-02-01T09:00:00Z'),
  ...chain('eu-ra-6',  'ado-pipelines', '2023-02-01T09:00:00Z'),
  ...chain('eu-ra-7',  'kong',          '2023-02-01T09:00:00Z'),
  ...chain('eu-ra-8',  'ado-pipelines', '2024-06-01T10:00:00Z'),

  // Enterprise users — Carol Osei (Security)
  ...chain('eu-ra-9',  'azure-ad',      '2021-08-01T09:00:00Z'),
  ...chain('eu-ra-10', 'azure-ad',      '2021-08-01T09:00:00Z'),
  ...highPrivChain('eu-ra-11', 'sap-btp', '2022-01-10T10:00:00Z'),
  ...highPrivChain('eu-ra-12', 'kong',    '2021-08-01T09:00:00Z'),

  // Enterprise users — David Reyes (Finance)
  ...chain('eu-ra-13', 'sap-btp',       '2020-12-01T09:00:00Z'),
  ...chain('eu-ra-14', 'sap-btp',       '2021-03-01T10:00:00Z'),
  ...chain('eu-ra-15', 'azure-ad',      '2020-12-01T09:00:00Z'),

  // Enterprise users — Eva Lindström (Finance Controller)
  ...chain('eu-ra-16', 'sap-btp',       '2019-07-01T09:00:00Z'),
  ...highPrivChain('eu-ra-17', 'sap-btp',   '2020-01-15T10:00:00Z'),
  ...highPrivChain('eu-ra-18', 'azure-ad',  '2020-01-15T10:00:00Z'),

  // Enterprise users — Frank Mueller (VP Eng)
  ...chain('eu-ra-19',     'azure-ad',      '2018-03-01T09:00:00Z'),
  ...highPrivChain('eu-ra-20', 'ado-pipelines', '2018-03-01T09:00:00Z'),
  ...highPrivChain('eu-ra-21', 'kong',          '2018-03-01T09:00:00Z'),
  ...highPrivChain('eu-ra-22', 'sap-btp',       '2019-01-01T09:00:00Z'),

  // Enterprise users — Grace Kim (CISO)
  ...highPrivChain('eu-ra-23', 'azure-ad', '2020-02-01T09:00:00Z'),
  ...chain('eu-ra-24',         'azure-ad', '2020-02-01T09:00:00Z'),
  ...highPrivChain('eu-ra-25', 'kong',     '2020-02-01T09:00:00Z'),

  // Contractors
  ...chain('eu-ra-26', 'ado-pipelines', '2025-09-05T09:00:00Z'),
  ...chain('eu-ra-27', 'azure-ad',      '2025-09-05T09:00:00Z'),
  ...chain('eu-ra-28', 'sap-btp',       '2025-11-05T09:00:00Z'),
  ...chain('eu-ra-29', 'sap-btp',       '2025-11-05T09:00:00Z'),

  // Inactive user — revoked
  ...chain('eu-ra-30', 'azure-ad',      '2021-05-01T09:00:00Z', true),
  ...chain('eu-ra-31', 'ado-pipelines', '2021-05-01T09:00:00Z', true),

  // Partner
  ...chain('eu-ra-32', 'kong',      '2025-06-05T09:00:00Z'),
  ...chain('eu-ra-33', 'azure-ad',  '2025-06-05T09:00:00Z'),

  // A rejected request for illustration
  ...rejectedChain('rejected-demo', 'sap-btp', '2026-04-18T08:00:00Z'),

  // ── Lifecycle Stage Showcase — complete event chains for every stage ──────

  // requested — just submitted
  { id: 'lc-requested-ev-1', assignmentId: 'lc-requested', stage: 'requested',
    timestamp: '2026-05-05T11:30:00Z', actor: 'alice.hartmann@acme.com',
    system: 'kong', details: 'Access request submitted via ACMP self-service portal. Awaiting risk evaluation.',
    riskScore: 15, automated: false },

  // risk-evaluated — scored by engine
  { id: 'lc-risk-ev-1', assignmentId: 'lc-risk-evaluated', stage: 'requested',
    timestamp: '2026-05-05T10:00:00Z', actor: 'bob.nakamura@acme.com',
    system: 'azure-ad', details: 'Access request submitted for AAD_UserAdmin role.',
    riskScore: 20, automated: false },
  { id: 'lc-risk-ev-2', assignmentId: 'lc-risk-evaluated', stage: 'risk-evaluated',
    timestamp: '2026-05-05T10:01:30Z', actor: 'risk-engine',
    system: 'azure-ad', details: 'OPA policy engine evaluated request. Composite risk score: 45. Factors: elevated role (+1.5), production environment (+0.8), no SoD conflicts. Workflow: STANDARD_NON_SOX. Routing to single approver.',
    riskScore: 45, automated: true },

  // pending-approval — in approver queue
  { id: 'lc-pending-ev-1', assignmentId: 'lc-pending-approval', stage: 'requested',
    timestamp: '2026-05-04T14:00:00Z', actor: 'carol.osei@acme.com',
    system: 'sap-btp', details: 'BTP_IntegrationDev role requested for SAP integration project.',
    riskScore: 30, automated: false },
  { id: 'lc-pending-ev-2', assignmentId: 'lc-pending-approval', stage: 'risk-evaluated',
    timestamp: '2026-05-04T14:01:00Z', actor: 'risk-engine',
    system: 'sap-btp', details: 'Risk score: 58. Elevated role in production SAP BTP. Manual approval required.',
    riskScore: 58, automated: true },
  { id: 'lc-pending-ev-3', assignmentId: 'lc-pending-approval', stage: 'pending-approval',
    timestamp: '2026-05-04T14:01:30Z', actor: 'workflow-engine',
    system: 'sap-btp', details: 'Request routed to approver queue. Notified: grace.kim@acme.com (Security). SLA: 4 hours. Escalation scheduled at 2026-05-04T18:01:30Z if no decision.',
    riskScore: 58, automated: true },

  // approved — decision made, provisioning queued
  { id: 'lc-approved-ev-1', assignmentId: 'lc-approved', stage: 'requested',
    timestamp: '2026-05-04T09:00:00Z', actor: 'david.reyes@acme.com',
    system: 'sap-btp', details: 'BTP_FinanceViewer role requested for quarterly reporting access.',
    riskScore: 12, automated: false },
  { id: 'lc-approved-ev-2', assignmentId: 'lc-approved', stage: 'risk-evaluated',
    timestamp: '2026-05-04T09:00:45Z', actor: 'risk-engine',
    system: 'sap-btp', details: 'Risk score: 12. Standard read-only role. Requester department matches role owning department. Auto-approval eligible.',
    riskScore: 12, automated: true },
  { id: 'lc-approved-ev-3', assignmentId: 'lc-approved', stage: 'pending-approval',
    timestamp: '2026-05-04T09:01:00Z', actor: 'workflow-engine',
    system: 'sap-btp', details: 'Low-risk request. Routed for single manager approval.',
    riskScore: 12, automated: true },
  { id: 'lc-approved-ev-4', assignmentId: 'lc-approved', stage: 'approved',
    timestamp: '2026-05-04T09:45:00Z', actor: 'eva.lindstrom@acme.com',
    system: 'sap-btp', details: 'Approved by Finance Controller. Justification verified. Provisioning queued.',
    riskScore: 12, automated: false },

  // provisioned — connector call in progress
  { id: 'lc-provisioned-ev-1', assignmentId: 'lc-provisioned', stage: 'requested',
    timestamp: '2026-05-03T16:00:00Z', actor: 'eva.lindstrom@acme.com',
    system: 'azure-ad', details: 'AAD_Reader role requested for directory read access.',
    riskScore: 8, automated: false },
  { id: 'lc-provisioned-ev-2', assignmentId: 'lc-provisioned', stage: 'risk-evaluated',
    timestamp: '2026-05-03T16:00:30Z', actor: 'risk-engine',
    system: 'azure-ad', details: 'Risk score: 8. Standard read-only role. Auto-approval policy P-READONLY-001 satisfied.',
    riskScore: 8, automated: true },
  { id: 'lc-provisioned-ev-3', assignmentId: 'lc-provisioned', stage: 'pending-approval',
    timestamp: '2026-05-03T16:00:35Z', actor: 'workflow-engine',
    system: 'azure-ad', details: 'Auto-approval eligible. Bypassing manual approval queue.',
    riskScore: 8, automated: true },
  { id: 'lc-provisioned-ev-4', assignmentId: 'lc-provisioned', stage: 'approved',
    timestamp: '2026-05-03T16:00:40Z', actor: 'policy-engine',
    system: 'azure-ad', details: 'AUTO_APPROVED by OPA policy engine. Policy: P-READONLY-001.',
    riskScore: 8, automated: true },
  { id: 'lc-provisioned-ev-5', assignmentId: 'lc-provisioned', stage: 'provisioned',
    timestamp: '2026-05-03T16:01:15Z', actor: 'azure-ad-connector',
    system: 'azure-ad', details: 'Connector call to MS Graph API: POST /groups/aad-directory-readers/members. HTTP 201 Created. Awaiting confirmation sync.',
    riskScore: 8, automated: true },

  // active — fully live
  { id: 'lc-active-ev-1', assignmentId: 'lc-active', stage: 'requested',
    timestamp: '2026-04-01T09:00:00Z', actor: 'frank.mueller@acme.com',
    system: 'ado-pipelines', details: 'ADO_Contributor role requested for pipeline management.',
    riskScore: 25, automated: false },
  { id: 'lc-active-ev-2', assignmentId: 'lc-active', stage: 'risk-evaluated',
    timestamp: '2026-04-01T09:01:00Z', actor: 'risk-engine',
    system: 'ado-pipelines', details: 'Risk score: 25. Elevated role, staging environment. Standard approval required.',
    riskScore: 25, automated: true },
  { id: 'lc-active-ev-3', assignmentId: 'lc-active', stage: 'pending-approval',
    timestamp: '2026-04-01T09:01:30Z', actor: 'workflow-engine',
    system: 'ado-pipelines', details: 'Routed to direct manager for approval.',
    riskScore: 25, automated: true },
  { id: 'lc-active-ev-4', assignmentId: 'lc-active', stage: 'approved',
    timestamp: '2026-04-01T10:15:00Z', actor: 'grace.kim@acme.com',
    system: 'ado-pipelines', details: 'Approved. Access justified for platform engineering work.',
    riskScore: 25, automated: false },
  { id: 'lc-active-ev-5', assignmentId: 'lc-active', stage: 'provisioned',
    timestamp: '2026-04-01T10:16:00Z', actor: 'ado-connector',
    system: 'ado-pipelines', details: 'ADO REST API: POST /ado-contributors. Member added to project group. HTTP 200 OK.',
    riskScore: 25, automated: true },
  { id: 'lc-active-ev-6', assignmentId: 'lc-active', stage: 'active',
    timestamp: '2026-04-01T10:17:00Z', actor: 'system',
    system: 'ado-pipelines', details: 'Role assignment confirmed active. Sync verified. Next recertification: 2026-07-01.',
    riskScore: 25, automated: true },

  // recertification-due — cert window triggered
  { id: 'lc-recert-ev-1', assignmentId: 'lc-recertification-due', stage: 'requested',
    timestamp: '2026-01-15T09:00:00Z', actor: 'grace.kim@acme.com',
    system: 'kong', details: 'gateway-config high-privilege role requested for CISO operations.',
    riskScore: 72, automated: false },
  { id: 'lc-recert-ev-2', assignmentId: 'lc-recertification-due', stage: 'risk-evaluated',
    timestamp: '2026-01-15T09:01:00Z', actor: 'risk-engine',
    system: 'kong', details: 'Risk score: 82. High-privilege role. Dual approval required.',
    riskScore: 82, automated: true },
  { id: 'lc-recert-ev-3', assignmentId: 'lc-recertification-due', stage: 'pending-approval',
    timestamp: '2026-01-15T09:01:30Z', actor: 'workflow-engine',
    system: 'kong', details: 'Routed to security officer + line manager (dual approval).',
    riskScore: 82, automated: true },
  { id: 'lc-recert-ev-4', assignmentId: 'lc-recertification-due', stage: 'approved',
    timestamp: '2026-01-15T11:00:00Z', actor: 'cto@acme.com',
    system: 'kong', details: 'First approval: CTO approved. Second approval: Security team approved. Dual approval satisfied.',
    riskScore: 82, automated: false },
  { id: 'lc-recert-ev-5', assignmentId: 'lc-recertification-due', stage: 'provisioned',
    timestamp: '2026-01-15T11:01:00Z', actor: 'kong-connector',
    system: 'kong', details: 'Kong Admin API: POST /consumers/grace.kim/acls. ACL group acl-gateway-config assigned.',
    riskScore: 82, automated: true },
  { id: 'lc-recert-ev-6', assignmentId: 'lc-recertification-due', stage: 'active',
    timestamp: '2026-01-15T11:02:00Z', actor: 'system',
    system: 'kong', details: 'Role active. 90-day recertification window scheduled.',
    riskScore: 82, automated: true },
  { id: 'lc-recert-ev-7', assignmentId: 'lc-recertification-due', stage: 'recertification-due',
    timestamp: '2026-04-15T09:00:00Z', actor: 'scheduler',
    system: 'kong', details: '90-day recertification window triggered. Owner (grace.kim@acme.com) and manager (cto@acme.com) notified. Certification deadline: 2026-04-29. Access will be auto-revoked if not certified.',
    riskScore: 88, automated: true },

  // revoke-requested — manager initiated
  { id: 'lc-revoke-ev-1', assignmentId: 'lc-revoke-requested', stage: 'requested',
    timestamp: '2025-09-05T09:00:00Z', actor: 'hiro.tanaka@contractor.acme.com',
    system: 'ado-pipelines', details: 'ADO_Contributor_STG role requested for staging pipeline work.',
    riskScore: 18, automated: false },
  { id: 'lc-revoke-ev-2', assignmentId: 'lc-revoke-requested', stage: 'risk-evaluated',
    timestamp: '2025-09-05T09:01:00Z', actor: 'risk-engine',
    system: 'ado-pipelines', details: 'Risk score: 18. Contractor, staging environment. Standard approval.',
    riskScore: 18, automated: true },
  { id: 'lc-revoke-ev-3', assignmentId: 'lc-revoke-requested', stage: 'pending-approval',
    timestamp: '2025-09-05T09:01:30Z', actor: 'workflow-engine',
    system: 'ado-pipelines', details: 'Routed to sponsor (frank.mueller@acme.com) for approval.',
    riskScore: 18, automated: true },
  { id: 'lc-revoke-ev-4', assignmentId: 'lc-revoke-requested', stage: 'approved',
    timestamp: '2025-09-05T10:00:00Z', actor: 'frank.mueller@acme.com',
    system: 'ado-pipelines', details: 'Approved by sponsor. Contractor access granted for project duration.',
    riskScore: 18, automated: false },
  { id: 'lc-revoke-ev-5', assignmentId: 'lc-revoke-requested', stage: 'provisioned',
    timestamp: '2025-09-05T10:01:00Z', actor: 'ado-connector',
    system: 'ado-pipelines', details: 'ADO REST API: contributor added to staging project group.',
    riskScore: 18, automated: true },
  { id: 'lc-revoke-ev-6', assignmentId: 'lc-revoke-requested', stage: 'active',
    timestamp: '2025-09-05T10:02:00Z', actor: 'system',
    system: 'ado-pipelines', details: 'Role active. Contract expiry: 2026-09-01.',
    riskScore: 18, automated: true },
  { id: 'lc-revoke-ev-7', assignmentId: 'lc-revoke-requested', stage: 'revoke-requested',
    timestamp: '2026-05-05T08:00:00Z', actor: 'frank.mueller@acme.com',
    system: 'ado-pipelines', details: 'Revocation requested by sponsor. Reason: contractor project completed ahead of schedule. Connector will remove access within 1 hour.',
    riskScore: 0, automated: false },

  // deprovisioned — fully removed
  { id: 'lc-deprov-ev-1', assignmentId: 'lc-deprovisioned', stage: 'requested',
    timestamp: '2021-05-01T09:00:00Z', actor: 'james.okafor@acme.com',
    system: 'azure-ad', details: 'AAD_Reader role requested for directory access.',
    riskScore: 10, automated: false },
  { id: 'lc-deprov-ev-2', assignmentId: 'lc-deprovisioned', stage: 'risk-evaluated',
    timestamp: '2021-05-01T09:01:00Z', actor: 'risk-engine',
    system: 'azure-ad', details: 'Risk score: 10. Standard read-only. Auto-approval eligible.',
    riskScore: 10, automated: true },
  { id: 'lc-deprov-ev-3', assignmentId: 'lc-deprovisioned', stage: 'approved',
    timestamp: '2021-05-01T09:01:30Z', actor: 'policy-engine',
    system: 'azure-ad', details: 'AUTO_APPROVED by policy engine.',
    riskScore: 10, automated: true },
  { id: 'lc-deprov-ev-4', assignmentId: 'lc-deprovisioned', stage: 'active',
    timestamp: '2021-05-01T09:02:00Z', actor: 'system',
    system: 'azure-ad', details: 'Role active.',
    riskScore: 10, automated: true },
  { id: 'lc-deprov-ev-5', assignmentId: 'lc-deprovisioned', stage: 'revoke-requested',
    timestamp: '2023-06-15T09:00:00Z', actor: 'hr-offboarding-system',
    system: 'azure-ad', details: 'HR offboarding event received: james.okafor@acme.com marked inactive. Emergency revocation triggered across all systems.',
    riskScore: 0, automated: true },
  { id: 'lc-deprov-ev-6', assignmentId: 'lc-deprovisioned', stage: 'deprovisioned',
    timestamp: '2023-06-15T09:08:00Z', actor: 'azure-ad-connector',
    system: 'azure-ad', details: 'MS Graph API: DELETE /groups/aad-directory-readers/members/james.okafor. HTTP 204 No Content. Access removed. Audit evidence archived.',
    riskScore: 0, automated: true },

  // expired — JIT time-bound access auto-expired
  { id: 'lc-expired-ev-1', assignmentId: 'lc-expired', stage: 'requested',
    timestamp: '2026-04-01T09:00:00Z', actor: 'ingrid.svensson@contractor.acme.com',
    system: 'sap-btp', details: 'JIT request: BTP_FinanceProcessor role for 8-hour SAP data migration window.',
    riskScore: 42, automated: false },
  { id: 'lc-expired-ev-2', assignmentId: 'lc-expired', stage: 'risk-evaluated',
    timestamp: '2026-04-01T09:01:00Z', actor: 'risk-engine',
    system: 'sap-btp', details: 'JIT request evaluated. Risk score: 42. Time-bound access (8h). Sponsor pre-approval on file. JIT policy P-JIT-CONTRACTOR-001 applied.',
    riskScore: 42, automated: true },
  { id: 'lc-expired-ev-3', assignmentId: 'lc-expired', stage: 'pending-approval',
    timestamp: '2026-04-01T09:01:30Z', actor: 'workflow-engine',
    system: 'sap-btp', details: 'JIT request routed to sponsor (eva.lindstrom@acme.com). SLA: 1 hour.',
    riskScore: 42, automated: true },
  { id: 'lc-expired-ev-4', assignmentId: 'lc-expired', stage: 'approved',
    timestamp: '2026-04-01T09:20:00Z', actor: 'eva.lindstrom@acme.com',
    system: 'sap-btp', details: 'JIT access approved. Duration: 8 hours. Auto-expiry set: 2026-04-01T17:00:00Z.',
    riskScore: 42, automated: false },
  { id: 'lc-expired-ev-5', assignmentId: 'lc-expired', stage: 'active',
    timestamp: '2026-04-01T09:21:00Z', actor: 'sap-btp-connector',
    system: 'sap-btp', details: 'JIT role provisioned. SAP BTP SCIM API: role collection assigned. Countdown timer started: 8h 0m remaining.',
    riskScore: 42, automated: true },
  { id: 'lc-expired-ev-6', assignmentId: 'lc-expired', stage: 'expired',
    timestamp: '2026-04-01T17:00:00Z', actor: 'jit-scheduler',
    system: 'sap-btp', details: 'JIT access window elapsed (8 hours). Auto-revocation triggered. SAP BTP SCIM API: role collection removed. Access expired as scheduled. Post-use audit report generated.',
    riskScore: 0, automated: true },

  // rejected — denied by approver
  { id: 'lc-rejected-ev-1', assignmentId: 'lc-rejected', stage: 'requested',
    timestamp: '2026-04-22T11:00:00Z', actor: 'karen.patel@acme.com',
    system: 'sap-btp', details: 'BTP_FinanceAdmin high-privilege role requested.',
    riskScore: 75, automated: false },
  { id: 'lc-rejected-ev-2', assignmentId: 'lc-rejected', stage: 'risk-evaluated',
    timestamp: '2026-04-22T11:01:00Z', actor: 'risk-engine',
    system: 'sap-btp', details: 'Risk score: 97. Account status: SUSPENDED. SoD conflict detected: SAP Finance Write + Approve. Policy DENY-SUSPENDED-USER-001 triggered.',
    riskScore: 97, automated: true },
  { id: 'lc-rejected-ev-3', assignmentId: 'lc-rejected', stage: 'pending-approval',
    timestamp: '2026-04-22T11:01:30Z', actor: 'workflow-engine',
    system: 'sap-btp', details: 'Critical risk score. Routed to security officer for mandatory review.',
    riskScore: 97, automated: true },
  { id: 'lc-rejected-ev-4', assignmentId: 'lc-rejected', stage: 'rejected',
    timestamp: '2026-04-22T13:00:00Z', actor: 'grace.kim@acme.com',
    system: 'sap-btp', details: 'REJECTED. Reason: Account suspended — access request denied pending HR review. SoD conflict not resolved. Requester notified. Incident ticket created: INC-2026-0422-001.',
    riskScore: 97, automated: false },

  // failed — connector call failed after retries
  { id: 'lc-failed-ev-1', assignmentId: 'lc-failed', stage: 'requested',
    timestamp: '2026-05-02T10:00:00Z', actor: 'svc-payments-processor',
    system: 'kong', details: 'gateway-config role requested for payments service.',
    riskScore: 55, automated: false },
  { id: 'lc-failed-ev-2', assignmentId: 'lc-failed', stage: 'risk-evaluated',
    timestamp: '2026-05-02T10:01:00Z', actor: 'risk-engine',
    system: 'kong', details: 'Risk score: 82. High-privilege role. Dual approval required.',
    riskScore: 82, automated: true },
  { id: 'lc-failed-ev-3', assignmentId: 'lc-failed', stage: 'pending-approval',
    timestamp: '2026-05-02T10:01:30Z', actor: 'workflow-engine',
    system: 'kong', details: 'Routed to security officer + line manager.',
    riskScore: 82, automated: true },
  { id: 'lc-failed-ev-4', assignmentId: 'lc-failed', stage: 'approved',
    timestamp: '2026-05-02T12:00:00Z', actor: 'frank.mueller@acme.com',
    system: 'kong', details: 'Dual approval satisfied. Provisioning queued.',
    riskScore: 82, automated: false },
  { id: 'lc-failed-ev-5', assignmentId: 'lc-failed', stage: 'provisioned',
    timestamp: '2026-05-02T12:01:00Z', actor: 'kong-connector',
    system: 'kong', details: 'Attempt 1/3: Kong Admin API POST /consumers/svc-payments-processor/acls — HTTP 503 Service Unavailable.',
    riskScore: 82, automated: true },
  { id: 'lc-failed-ev-6', assignmentId: 'lc-failed', stage: 'failed',
    timestamp: '2026-05-02T12:16:00Z', actor: 'kong-connector',
    system: 'kong', details: 'PROVISIONING FAILED after 3 retries (exponential backoff: 1m, 4m, 9m). Kong Admin API unreachable. Error: connection timeout after 30s. Requester and approver notified. Manual intervention required. Incident: INC-2026-0502-003.',
    riskScore: 82, automated: true },
]
