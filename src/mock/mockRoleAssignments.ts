import type { RoleAssignment } from '../types/domain'
import { mockKongRoles, mockSapBtpRoles, mockAzureAdRoles, mockAdoRoles } from './mockRoles'
import { mockConsumers } from './mockConsumers'
import { mockEnterpriseUsers } from './mockEnterpriseUsers'

const kr = mockKongRoles
const br = mockSapBtpRoles
const ar = mockAzureAdRoles
const dr = mockAdoRoles
const c  = mockConsumers
const eu = mockEnterpriseUsers

export const mockRoleAssignments: RoleAssignment[] = [
  // ── Kong consumer assignments ─────────────────────────────────────────────
  { id: 'ra-1',  principalId: c[0].id,  principalType: 'consumer', consumer: c[0],  role: kr[0],  severity: 'low',      assignedAt: '2026-01-10T09:00:00Z', approvedBy: 'alice.hartmann@acme.com', isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-2',  principalId: c[0].id,  principalType: 'consumer', consumer: c[0],  role: kr[1],  severity: 'medium',   assignedAt: '2026-01-12T10:00:00Z', approvedBy: 'bob.nakamura@acme.com',   isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-3',  principalId: c[1].id,  principalType: 'consumer', consumer: c[1],  role: kr[3],  severity: 'low',      assignedAt: '2026-01-15T11:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-4',  principalId: c[1].id,  principalType: 'consumer', consumer: c[1],  role: kr[4],  severity: 'critical', assignedAt: '2026-01-20T08:30:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'recertification-due', expiresAt: '2026-06-01T00:00:00Z' },
  { id: 'ra-5',  principalId: c[2].id,  principalType: 'consumer', consumer: c[2],  role: kr[5],  severity: 'low',      assignedAt: '2026-01-22T14:00:00Z', approvedBy: 'alice.hartmann@acme.com', isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-6',  principalId: c[2].id,  principalType: 'consumer', consumer: c[2],  role: kr[6],  severity: 'medium',   assignedAt: '2026-01-25T09:00:00Z', approvedBy: 'bob.nakamura@acme.com',   isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-7',  principalId: c[3].id,  principalType: 'consumer', consumer: c[3],  role: kr[8],  severity: 'high',     assignedAt: '2026-02-01T10:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-8',  principalId: c[3].id,  principalType: 'consumer', consumer: c[3],  role: kr[9],  severity: 'low',      assignedAt: '2026-02-03T11:00:00Z', approvedBy: 'alice.hartmann@acme.com', isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-9',  principalId: c[4].id,  principalType: 'consumer', consumer: c[4],  role: kr[14], severity: 'low',      assignedAt: '2026-02-05T12:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-10', principalId: c[5].id,  principalType: 'consumer', consumer: c[5],  role: kr[2],  severity: 'critical', assignedAt: '2026-02-10T10:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-11', principalId: c[6].id,  principalType: 'consumer', consumer: c[6],  role: kr[3],  severity: 'low',      assignedAt: '2026-02-12T11:00:00Z', approvedBy: 'alice.hartmann@acme.com', isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-12', principalId: c[7].id,  principalType: 'consumer', consumer: c[7],  role: kr[7],  severity: 'high',     assignedAt: '2026-02-15T08:00:00Z', approvedBy: 'frank.mueller@acme.com',  isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-13', principalId: c[8].id,  principalType: 'consumer', consumer: c[8],  role: kr[9],  severity: 'low',      assignedAt: '2026-02-18T09:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-14', principalId: c[9].id,  principalType: 'consumer', consumer: c[9],  role: kr[18], severity: 'critical', assignedAt: '2026-02-20T10:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'recertification-due', expiresAt: '2026-07-01T00:00:00Z' },
  { id: 'ra-15', principalId: c[10].id, principalType: 'consumer', consumer: c[10], role: kr[10], severity: 'low',      assignedAt: '2026-02-22T11:00:00Z', approvedBy: 'bob.nakamura@acme.com',   isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-16', principalId: c[11].id, principalType: 'consumer', consumer: c[11], role: kr[11], severity: 'medium',   assignedAt: '2026-02-25T12:00:00Z', approvedBy: 'alice.hartmann@acme.com', isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-17', principalId: c[12].id, principalType: 'consumer', consumer: c[12], role: kr[5],  severity: 'low',      assignedAt: '2026-03-01T09:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-18', principalId: c[13].id, principalType: 'consumer', consumer: c[13], role: kr[17], severity: 'medium',   assignedAt: '2026-03-03T10:00:00Z', approvedBy: 'bob.nakamura@acme.com',   isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-19', principalId: c[14].id, principalType: 'consumer', consumer: c[14], role: kr[14], severity: 'low',      assignedAt: '2026-03-05T11:00:00Z', approvedBy: 'alice.hartmann@acme.com', isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-20', principalId: c[15].id, principalType: 'consumer', consumer: c[15], role: kr[12], severity: 'high',     assignedAt: '2026-03-08T08:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'active' },

  // ── SAP BTP consumer assignments ──────────────────────────────────────────
  { id: 'ra-31', principalId: c[30].id, principalType: 'consumer', consumer: c[30], role: br[1], severity: 'medium',   assignedAt: '2026-02-01T09:00:00Z', approvedBy: 'eva.lindstrom@acme.com',  isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-32', principalId: c[31].id, principalType: 'consumer', consumer: c[31], role: br[3], severity: 'medium',   assignedAt: '2026-02-10T10:00:00Z', approvedBy: 'alice.hartmann@acme.com', isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-33', principalId: c[32].id, principalType: 'consumer', consumer: c[32], role: br[6], severity: 'low',      assignedAt: '2026-03-01T11:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: true,  lifecycleStage: 'active' },

  // ── Azure AD service principal assignments ────────────────────────────────
  { id: 'ra-34', principalId: c[33].id, principalType: 'consumer', consumer: c[33], role: ar[0], severity: 'low',      assignedAt: '2026-01-15T09:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-35', principalId: c[34].id, principalType: 'consumer', consumer: c[34], role: ar[4], severity: 'low',      assignedAt: '2026-01-20T10:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-36', principalId: c[35].id, principalType: 'consumer', consumer: c[35], role: ar[7], severity: 'medium',   assignedAt: '2026-02-05T11:00:00Z', approvedBy: 'alice.hartmann@acme.com', isActive: true,  lifecycleStage: 'active' },

  // ── ADO service connection assignments ────────────────────────────────────
  { id: 'ra-37', principalId: c[36].id, principalType: 'consumer', consumer: c[36], role: dr[2], severity: 'high',     assignedAt: '2026-01-10T09:00:00Z', approvedBy: 'frank.mueller@acme.com',  isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-38', principalId: c[37].id, principalType: 'consumer', consumer: c[37], role: dr[1], severity: 'medium',   assignedAt: '2026-01-15T10:00:00Z', approvedBy: 'alice.hartmann@acme.com', isActive: true,  lifecycleStage: 'active' },
  { id: 'ra-39', principalId: c[38].id, principalType: 'consumer', consumer: c[38], role: dr[6], severity: 'low',      assignedAt: '2026-02-01T11:00:00Z', approvedBy: 'bob.nakamura@acme.com',   isActive: true,  lifecycleStage: 'active' },

  // ── Enterprise user assignments — Alice Hartmann (eu-1) ───────────────────
  { id: 'eu-ra-1',  principalId: eu[0].id, principalType: 'enterprise-user', enterpriseUser: eu[0], role: kr[7],  severity: 'high',     assignedAt: '2022-04-01T09:00:00Z', approvedBy: 'frank.mueller@acme.com',  isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-2',  principalId: eu[0].id, principalType: 'enterprise-user', enterpriseUser: eu[0], role: ar[6],  severity: 'medium',   assignedAt: '2022-04-01T09:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-3',  principalId: eu[0].id, principalType: 'enterprise-user', enterpriseUser: eu[0], role: dr[4],  severity: 'medium',   assignedAt: '2023-01-15T10:00:00Z', approvedBy: 'frank.mueller@acme.com',  isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-4',  principalId: eu[0].id, principalType: 'enterprise-user', enterpriseUser: eu[0], role: kr[9],  severity: 'low',      assignedAt: '2022-04-01T09:00:00Z', approvedBy: 'alice.hartmann@acme.com', isActive: true,  lifecycleStage: 'active' },

  // ── Enterprise user assignments — Bob Nakamura (eu-2) ─────────────────────
  { id: 'eu-ra-5',  principalId: eu[1].id, principalType: 'enterprise-user', enterpriseUser: eu[1], role: ar[1],  severity: 'medium',   assignedAt: '2023-02-01T09:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-6',  principalId: eu[1].id, principalType: 'enterprise-user', enterpriseUser: eu[1], role: dr[1],  severity: 'medium',   assignedAt: '2023-02-01T09:00:00Z', approvedBy: 'frank.mueller@acme.com',  isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-7',  principalId: eu[1].id, principalType: 'enterprise-user', enterpriseUser: eu[1], role: kr[10], severity: 'low',      assignedAt: '2023-02-01T09:00:00Z', approvedBy: 'alice.hartmann@acme.com', isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-8',  principalId: eu[1].id, principalType: 'enterprise-user', enterpriseUser: eu[1], role: dr[5],  severity: 'medium',   assignedAt: '2024-06-01T10:00:00Z', approvedBy: 'frank.mueller@acme.com',  isActive: true,  lifecycleStage: 'active' },

  // ── Enterprise user assignments — Carol Osei / Security (eu-3) ───────────
  { id: 'eu-ra-9',  principalId: eu[2].id, principalType: 'enterprise-user', enterpriseUser: eu[2], role: ar[2],  severity: 'medium',   assignedAt: '2021-08-01T09:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-10', principalId: eu[2].id, principalType: 'enterprise-user', enterpriseUser: eu[2], role: ar[5],  severity: 'medium',   assignedAt: '2021-08-01T09:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-11', principalId: eu[2].id, principalType: 'enterprise-user', enterpriseUser: eu[2], role: br[7],  severity: 'high',     assignedAt: '2022-01-10T10:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'recertification-due', expiresAt: '2026-08-01T00:00:00Z' },
  { id: 'eu-ra-12', principalId: eu[2].id, principalType: 'enterprise-user', enterpriseUser: eu[2], role: kr[12], severity: 'high',     assignedAt: '2021-08-01T09:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'active' },

  // ── Enterprise user assignments — David Reyes / Finance (eu-4) ───────────
  { id: 'eu-ra-13', principalId: eu[3].id, principalType: 'enterprise-user', enterpriseUser: eu[3], role: br[0],  severity: 'low',      assignedAt: '2020-12-01T09:00:00Z', approvedBy: 'eva.lindstrom@acme.com',  isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-14', principalId: eu[3].id, principalType: 'enterprise-user', enterpriseUser: eu[3], role: br[1],  severity: 'medium',   assignedAt: '2021-03-01T10:00:00Z', approvedBy: 'eva.lindstrom@acme.com',  isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-15', principalId: eu[3].id, principalType: 'enterprise-user', enterpriseUser: eu[3], role: ar[0],  severity: 'low',      assignedAt: '2020-12-01T09:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: true,  lifecycleStage: 'active' },

  // ── Enterprise user assignments — Eva Lindström / Finance Controller (eu-5)
  { id: 'eu-ra-16', principalId: eu[4].id, principalType: 'enterprise-user', enterpriseUser: eu[4], role: br[0],  severity: 'low',      assignedAt: '2019-07-01T09:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-17', principalId: eu[4].id, principalType: 'enterprise-user', enterpriseUser: eu[4], role: br[2],  severity: 'critical', assignedAt: '2020-01-15T10:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'recertification-due', expiresAt: '2026-06-15T00:00:00Z' },
  { id: 'eu-ra-18', principalId: eu[4].id, principalType: 'enterprise-user', enterpriseUser: eu[4], role: ar[3],  severity: 'critical', assignedAt: '2020-01-15T10:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'recertification-due', expiresAt: '2026-06-15T00:00:00Z' },

  // ── Enterprise user assignments — Frank Mueller / VP Eng (eu-6) ──────────
  { id: 'eu-ra-19', principalId: eu[5].id, principalType: 'enterprise-user', enterpriseUser: eu[5], role: ar[1],  severity: 'high',     assignedAt: '2018-03-01T09:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-20', principalId: eu[5].id, principalType: 'enterprise-user', enterpriseUser: eu[5], role: dr[3],  severity: 'critical', assignedAt: '2018-03-01T09:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-21', principalId: eu[5].id, principalType: 'enterprise-user', enterpriseUser: eu[5], role: kr[7],  severity: 'high',     assignedAt: '2018-03-01T09:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-22', principalId: eu[5].id, principalType: 'enterprise-user', enterpriseUser: eu[5], role: br[5],  severity: 'critical', assignedAt: '2019-01-01T09:00:00Z', approvedBy: 'grace.kim@acme.com',      isActive: true,  lifecycleStage: 'active' },

  // ── Enterprise user assignments — Grace Kim / CISO (eu-7) ────────────────
  { id: 'eu-ra-23', principalId: eu[6].id, principalType: 'enterprise-user', enterpriseUser: eu[6], role: ar[1],  severity: 'critical', assignedAt: '2020-02-01T09:00:00Z', approvedBy: 'cto@acme.com',            isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-24', principalId: eu[6].id, principalType: 'enterprise-user', enterpriseUser: eu[6], role: ar[4],  severity: 'medium',   assignedAt: '2020-02-01T09:00:00Z', approvedBy: 'cto@acme.com',            isActive: true,  lifecycleStage: 'active' },
  { id: 'eu-ra-25', principalId: eu[6].id, principalType: 'enterprise-user', enterpriseUser: eu[6], role: kr[18], severity: 'critical', assignedAt: '2020-02-01T09:00:00Z', approvedBy: 'cto@acme.com',            isActive: true,  lifecycleStage: 'active' },

  // ── Enterprise user assignments — Hiro Tanaka / Contractor (eu-8) ────────
  { id: 'eu-ra-26', principalId: eu[7].id, principalType: 'enterprise-user', enterpriseUser: eu[7], role: dr[6],  severity: 'low',      assignedAt: '2025-09-05T09:00:00Z', approvedBy: 'frank.mueller@acme.com',  isActive: true,  lifecycleStage: 'active', expiresAt: '2026-09-01T00:00:00Z' },
  { id: 'eu-ra-27', principalId: eu[7].id, principalType: 'enterprise-user', enterpriseUser: eu[7], role: ar[7],  severity: 'low',      assignedAt: '2025-09-05T09:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: true,  lifecycleStage: 'active', expiresAt: '2026-09-01T00:00:00Z' },

  // ── Enterprise user assignments — Ingrid Svensson / SAP Contractor (eu-9)
  { id: 'eu-ra-28', principalId: eu[8].id, principalType: 'enterprise-user', enterpriseUser: eu[8], role: br[6],  severity: 'low',      assignedAt: '2025-11-05T09:00:00Z', approvedBy: 'eva.lindstrom@acme.com',  isActive: true,  lifecycleStage: 'active', expiresAt: '2026-11-01T00:00:00Z' },
  { id: 'eu-ra-29', principalId: eu[8].id, principalType: 'enterprise-user', enterpriseUser: eu[8], role: br[1],  severity: 'medium',   assignedAt: '2025-11-05T09:00:00Z', approvedBy: 'eva.lindstrom@acme.com',  isActive: true,  lifecycleStage: 'active', expiresAt: '2026-11-01T00:00:00Z' },

  // ── Inactive user — James Okafor (eu-10) — revoked assignments ───────────
  { id: 'eu-ra-30', principalId: eu[9].id, principalType: 'enterprise-user', enterpriseUser: eu[9], role: ar[0],  severity: 'low',      assignedAt: '2021-05-01T09:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: false, lifecycleStage: 'deprovisioned' },
  { id: 'eu-ra-31', principalId: eu[9].id, principalType: 'enterprise-user', enterpriseUser: eu[9], role: dr[6],  severity: 'low',      assignedAt: '2021-05-01T09:00:00Z', approvedBy: 'frank.mueller@acme.com',  isActive: false, lifecycleStage: 'deprovisioned' },

  // ── Partner — Luca Bianchi (eu-12) ───────────────────────────────────────
  { id: 'eu-ra-32', principalId: eu[11].id, principalType: 'enterprise-user', enterpriseUser: eu[11], role: kr[3],  severity: 'low',    assignedAt: '2025-06-05T09:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: true,  lifecycleStage: 'active', expiresAt: '2026-12-01T00:00:00Z' },
  { id: 'eu-ra-33', principalId: eu[11].id, principalType: 'enterprise-user', enterpriseUser: eu[11], role: ar[7],  severity: 'low',    assignedAt: '2025-06-05T09:00:00Z', approvedBy: 'carol.osei@acme.com',     isActive: true,  lifecycleStage: 'active', expiresAt: '2026-12-01T00:00:00Z' },
]

// ── Lifecycle Stage Showcase — one assignment per stage ───────────────────────
// These are dedicated demo assignments so every stage appears in the Role Lifecycle page

export const mockLifecycleShowcaseAssignments: RoleAssignment[] = [
  // Stage: requested — just submitted, not yet evaluated
  {
    id: 'lc-requested',
    principalId: eu[0].id, principalType: 'enterprise-user', enterpriseUser: eu[0],
    role: kr[1], severity: 'medium',
    assignedAt: '2026-05-05T11:30:00Z', approvedBy: '',
    isActive: false, lifecycleStage: 'requested',
  },
  // Stage: risk-evaluated — risk engine has scored it
  {
    id: 'lc-risk-evaluated',
    principalId: eu[1].id, principalType: 'enterprise-user', enterpriseUser: eu[1],
    role: ar[2], severity: 'medium',
    assignedAt: '2026-05-05T10:00:00Z', approvedBy: '',
    isActive: false, lifecycleStage: 'risk-evaluated',
  },
  // Stage: pending-approval — waiting for approver
  {
    id: 'lc-pending-approval',
    principalId: eu[2].id, principalType: 'enterprise-user', enterpriseUser: eu[2],
    role: br[3], severity: 'high',
    assignedAt: '2026-05-04T14:00:00Z', approvedBy: '',
    isActive: false, lifecycleStage: 'pending-approval',
  },
  // Stage: approved — approved, not yet provisioned
  {
    id: 'lc-approved',
    principalId: eu[3].id, principalType: 'enterprise-user', enterpriseUser: eu[3],
    role: br[0], severity: 'low',
    assignedAt: '2026-05-04T09:00:00Z', approvedBy: 'eva.lindstrom@acme.com',
    isActive: false, lifecycleStage: 'approved',
  },
  // Stage: provisioned — connector call made, confirming
  {
    id: 'lc-provisioned',
    principalId: eu[4].id, principalType: 'enterprise-user', enterpriseUser: eu[4],
    role: ar[0], severity: 'low',
    assignedAt: '2026-05-03T16:00:00Z', approvedBy: 'carol.osei@acme.com',
    isActive: false, lifecycleStage: 'provisioned',
  },
  // Stage: active — fully live
  {
    id: 'lc-active',
    principalId: eu[5].id, principalType: 'enterprise-user', enterpriseUser: eu[5],
    role: dr[1], severity: 'medium',
    assignedAt: '2026-04-01T09:00:00Z', approvedBy: 'frank.mueller@acme.com',
    isActive: true, lifecycleStage: 'active',
  },
  // Stage: recertification-due — 90-day cert window triggered
  {
    id: 'lc-recertification-due',
    principalId: eu[6].id, principalType: 'enterprise-user', enterpriseUser: eu[6],
    role: kr[7], severity: 'high',
    assignedAt: '2026-01-15T09:00:00Z', approvedBy: 'grace.kim@acme.com',
    isActive: true, lifecycleStage: 'recertification-due',
    expiresAt: '2026-07-15T00:00:00Z',
  },
  // Stage: revoke-requested — manager initiated revocation
  {
    id: 'lc-revoke-requested',
    principalId: eu[7].id, principalType: 'enterprise-user', enterpriseUser: eu[7],
    role: dr[6], severity: 'low',
    assignedAt: '2025-09-05T09:00:00Z', approvedBy: 'frank.mueller@acme.com',
    isActive: true, lifecycleStage: 'revoke-requested',
  },
  // Stage: deprovisioned — fully removed from target system
  {
    id: 'lc-deprovisioned',
    principalId: eu[9].id, principalType: 'enterprise-user', enterpriseUser: eu[9],
    role: ar[0], severity: 'low',
    assignedAt: '2021-05-01T09:00:00Z', approvedBy: 'carol.osei@acme.com',
    isActive: false, lifecycleStage: 'deprovisioned',
  },
  // Stage: expired — time-bound JIT access expired automatically
  {
    id: 'lc-expired',
    principalId: eu[8].id, principalType: 'enterprise-user', enterpriseUser: eu[8],
    role: br[1], severity: 'medium',
    assignedAt: '2026-04-01T09:00:00Z', approvedBy: 'eva.lindstrom@acme.com',
    isActive: false, lifecycleStage: 'expired',
    expiresAt: '2026-04-01T17:00:00Z',
    isJit: true, jitDurationHours: 8,
  },
  // Stage: rejected — denied by approver
  {
    id: 'lc-rejected',
    principalId: eu[10].id, principalType: 'enterprise-user', enterpriseUser: eu[10],
    role: br[2], severity: 'critical',
    assignedAt: '2026-04-22T11:00:00Z', approvedBy: '',
    isActive: false, lifecycleStage: 'rejected',
  },
  // Stage: failed — connector call to target system failed after retries
  {
    id: 'lc-failed',
    principalId: c[0].id, principalType: 'consumer', consumer: c[0],
    role: kr[7], severity: 'high',
    assignedAt: '2026-05-02T10:00:00Z', approvedBy: 'frank.mueller@acme.com',
    isActive: false, lifecycleStage: 'failed',
  },
]
