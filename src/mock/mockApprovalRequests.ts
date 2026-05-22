import type { ApprovalRequest } from '../types/domain'
import { mockKongRoles, mockSapBtpRoles, mockAzureAdRoles } from './mockRoles'
import { mockConsumers } from './mockConsumers'
import { mockEnterpriseUsers } from './mockEnterpriseUsers'

const kr = mockKongRoles
const br = mockSapBtpRoles
const ar = mockAzureAdRoles
const c  = mockConsumers
const eu = mockEnterpriseUsers

export const mockApprovalRequests: ApprovalRequest[] = [
  // ── PENDING (6) ───────────────────────────────────────────────────────────
  {
    id: 'ar-1',
    principalId: c[0].id,
    principalType: 'consumer',
    consumer: c[0],
    role: kr[2], // payments-admin (high-privilege, Kong)
    requestType: 'assign',
    requester: 'ivan@acme.com',
    submittedAt: '2026-05-04T08:00:00Z',
    status: 'pending',
    severity: 'critical',
    sodConflicts: [],
    justification: 'Need admin access to process end-of-quarter reconciliation.',
    approvers: [],
  },
  {
    id: 'ar-2',
    principalId: c[1].id,
    principalType: 'consumer',
    consumer: c[1],
    role: kr[4], // identity-admin (high-privilege, Kong)
    requestType: 'assign',
    requester: 'judy@acme.com',
    submittedAt: '2026-05-04T09:30:00Z',
    status: 'pending',
    severity: 'critical',
    sodConflicts: [
      { id: 'sod-2', roleA: 'role-5', roleB: 'role-12', classification: 'Admin + Auditor Conflict', detectedAt: '2026-05-04T09:31:00Z' },
    ],
    justification: 'Temporary access required for identity migration project.',
    approvers: [],
  },
  {
    id: 'ar-3',
    principalId: eu[3].id,
    principalType: 'enterprise-user',
    enterpriseUser: eu[3], // David Reyes
    role: br[2], // BTP_FinanceAdmin (high-privilege, SAP BTP)
    requestType: 'assign',
    requester: 'david.reyes@acme.com',
    submittedAt: '2026-05-04T11:00:00Z',
    status: 'pending',
    severity: 'critical',
    sodConflicts: [
      { id: 'sod-4', roleA: 'role-btp-3', roleB: 'role-btp-5', classification: 'SAP Finance Write + Approve', detectedAt: '2026-05-04T11:01:00Z' },
    ],
    justification: 'Temporary admin access needed for year-end financial close in SAP BTP.',
    approvers: [],
  },
  {
    id: 'ar-4',
    principalId: eu[1].id,
    principalType: 'enterprise-user',
    enterpriseUser: eu[1], // Bob Nakamura
    role: ar[2], // AAD_UserAdmin (Azure AD)
    requestType: 'assign',
    requester: 'bob.nakamura@acme.com',
    submittedAt: '2026-05-04T13:00:00Z',
    status: 'pending',
    severity: 'medium',
    sodConflicts: [],
    justification: 'Need user admin access in Azure AD to manage contractor onboarding.',
    approvers: [],
  },
  {
    id: 'ar-5',
    principalId: c[36].id,
    principalType: 'consumer',
    consumer: c[36], // ado-svc-prod-deploy
    role: ar[1], // AAD_GlobalAdmin (high-privilege, Azure AD)
    requestType: 'assign',
    requester: 'frank.mueller@acme.com',
    submittedAt: '2026-05-05T07:00:00Z',
    status: 'pending',
    severity: 'critical',
    sodConflicts: [],
    justification: 'CI/CD pipeline service principal needs elevated Azure AD access for automated provisioning.',
    approvers: [],
  },
  {
    id: 'ar-6',
    principalId: c[9].id,
    principalType: 'consumer',
    consumer: c[9],
    role: kr[14], // reporting-read (Kong)
    requestType: 'assign',
    requester: 'nina@acme.com',
    submittedAt: '2026-05-05T08:30:00Z',
    status: 'pending',
    severity: 'low',
    sodConflicts: [],
    justification: 'Config manager service needs read access to reporting for health checks.',
    approvers: [],
  },

  // ── APPROVED (5) ─────────────────────────────────────────────────────────
  {
    id: 'ar-7',
    principalId: c[2].id,
    principalType: 'consumer',
    consumer: c[2],
    role: kr[5], // analytics-read (Kong)
    requestType: 'assign',
    requester: 'oscar@acme.com',
    submittedAt: '2026-04-28T09:00:00Z',
    status: 'approved',
    severity: 'low',
    sodConflicts: [],
    justification: 'Analytics collector needs read access for staging environment.',
    approvers: [{ approver: 'alice.hartmann@acme.com', decision: 'approved', decidedAt: '2026-04-28T10:30:00Z' }],
  },
  {
    id: 'ar-8',
    principalId: eu[3].id,
    principalType: 'enterprise-user',
    enterpriseUser: eu[3], // David Reyes
    role: br[0], // BTP_FinanceViewer (SAP BTP)
    requestType: 'assign',
    requester: 'david.reyes@acme.com',
    submittedAt: '2026-04-29T10:00:00Z',
    status: 'approved',
    severity: 'low',
    sodConflicts: [],
    justification: 'Finance analyst needs view access to SAP BTP Finance module.',
    approvers: [{ approver: 'eva.lindstrom@acme.com', decision: 'approved', decidedAt: '2026-04-29T11:00:00Z' }],
  },
  {
    id: 'ar-9',
    principalId: eu[7].id,
    principalType: 'enterprise-user',
    enterpriseUser: eu[7], // Hiro Tanaka (contractor)
    role: ar[7], // AAD_Reader_STG (Azure AD)
    requestType: 'assign',
    requester: 'hiro.tanaka@contractor.acme.com',
    submittedAt: '2026-04-30T08:00:00Z',
    status: 'approved',
    severity: 'low',
    sodConflicts: [],
    justification: 'Contractor needs staging Azure AD read access for integration work.',
    approvers: [{ approver: 'carol.osei@acme.com', decision: 'approved', decidedAt: '2026-04-30T09:00:00Z' }],
  },
  {
    id: 'ar-10',
    principalId: c[8].id,
    principalType: 'consumer',
    consumer: c[8],
    role: kr[7], // gateway-config (high-privilege, Kong)
    requestType: 'assign',
    requester: 'bob.nakamura@acme.com',
    submittedAt: '2026-04-25T09:00:00Z',
    status: 'approved',
    severity: 'critical',
    sodConflicts: [],
    justification: 'Audit logger needs gateway config access for compliance monitoring.',
    approvers: [
      { approver: 'frank.mueller@acme.com', decision: 'approved', decidedAt: '2026-04-25T11:00:00Z' },
      { approver: 'grace.kim@acme.com',     decision: 'approved', decidedAt: '2026-04-25T14:00:00Z' },
    ],
  },
  {
    id: 'ar-11',
    principalId: c[37].id,
    principalType: 'consumer',
    consumer: c[37], // ado-svc-stg-deploy
    role: ar[1], // AAD_GlobalAdmin (Azure AD)
    requestType: 'assign',
    requester: 'carol.osei@acme.com',
    submittedAt: '2026-05-01T10:00:00Z',
    status: 'approved',
    severity: 'low',
    sodConflicts: [],
    justification: 'Staging ADO deploy service needs contributor access.',
    approvers: [{ approver: 'frank.mueller@acme.com', decision: 'approved', decidedAt: '2026-05-01T11:30:00Z' }],
  },

  // ── REJECTED (3) + ESCALATED (1) ─────────────────────────────────────────
  {
    id: 'ar-12',
    principalId: c[11].id,
    principalType: 'consumer',
    consumer: c[11],
    role: kr[18], // super-admin (high-privilege, Kong)
    requestType: 'assign',
    requester: 'dave@acme.com',
    submittedAt: '2026-04-20T09:00:00Z',
    status: 'rejected',
    severity: 'critical',
    sodConflicts: [],
    justification: 'Need super-admin for emergency deployment.',
    approvers: [
      { approver: 'grace.kim@acme.com', decision: 'rejected', reason: 'Super-admin access not permitted for automated services. Use scoped role instead.', decidedAt: '2026-04-20T10:00:00Z' },
    ],
  },
  {
    id: 'ar-13',
    principalId: eu[10].id,
    principalType: 'enterprise-user',
    enterpriseUser: eu[10], // Karen Patel (suspended)
    role: br[2], // BTP_FinanceAdmin (high-privilege, SAP BTP)
    requestType: 'assign',
    requester: 'karen.patel@acme.com',
    submittedAt: '2026-04-22T11:00:00Z',
    status: 'rejected',
    severity: 'critical',
    sodConflicts: [
      { id: 'sod-4', roleA: 'role-btp-3', roleB: 'role-btp-5', classification: 'SAP Finance Write + Approve', detectedAt: '2026-04-22T11:01:00Z' },
    ],
    justification: 'Finance admin needed for data export.',
    approvers: [
      { approver: 'grace.kim@acme.com', decision: 'rejected', reason: 'Account suspended. Access request denied pending HR review.', decidedAt: '2026-04-22T13:00:00Z' },
    ],
  },
  {
    id: 'ar-14',
    principalId: eu[1].id,
    principalType: 'enterprise-user',
    enterpriseUser: eu[1], // Bob Nakamura
    role: ar[1], // AAD_GlobalAdmin (high-privilege, Azure AD)
    requestType: 'assign',
    requester: 'bob.nakamura@acme.com',
    submittedAt: '2026-04-18T08:00:00Z',
    status: 'rejected',
    severity: 'critical',
    sodConflicts: [
      { id: 'sod-5', roleA: 'role-aad-2', roleB: 'role-aad-4', classification: 'Azure Global Admin + Billing Admin', detectedAt: '2026-04-18T08:01:00Z' },
    ],
    justification: 'Global admin needed for Azure subscription management.',
    approvers: [
      { approver: 'grace.kim@acme.com', decision: 'rejected', reason: 'SoD conflict with existing Billing Admin role. Resolve conflict first.', decidedAt: '2026-04-18T10:00:00Z' },
    ],
  },
  {
    id: 'ar-15',
    principalId: c[14].id,
    principalType: 'consumer',
    consumer: c[14],
    role: kr[8], // orders-write (Kong)
    requestType: 'assign',
    requester: 'grace.kim@acme.com',
    submittedAt: '2026-04-15T14:00:00Z',
    status: 'escalated',
    severity: 'high',
    sodConflicts: [],
    justification: 'Orders write needed for new fulfilment service.',
    escalatedAt: '2026-04-17T14:00:00Z',
    approvers: [],
  },
]
