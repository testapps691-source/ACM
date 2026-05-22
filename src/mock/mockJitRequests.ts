import type { JitRequest } from '../types/domain'
import { mockKongRoles, mockAzureAdRoles, mockSapBtpRoles } from './mockRoles'
import { mockEnterpriseUsers } from './mockEnterpriseUsers'
import { mockConsumers } from './mockConsumers'

const eu = mockEnterpriseUsers
const c  = mockConsumers

// Active JIT — expires in ~2 hours from "now" (2026-05-05T12:00:00Z)
const activeExpiry  = '2026-05-05T14:00:00Z'
const expiredExpiry = '2026-05-04T10:00:00Z'

export const mockJitRequests: JitRequest[] = [
  {
    id: 'jit-1',
    principalId: eu[0].id,
    principalType: 'enterprise-user',
    enterpriseUser: eu[0], // Alice Hartmann
    role: mockKongRoles[2], // payments-admin (high-privilege)
    durationHours: 4,
    justification: 'Emergency payment reconciliation — end of quarter processing requires temporary admin access.',
    requester: 'alice.hartmann@acme.com',
    submittedAt: '2026-05-05T10:00:00Z',
    status: 'active',
    activatedAt: '2026-05-05T10:15:00Z',
    expiresAt: activeExpiry,
    approvedBy: 'grace.kim@acme.com',
    policyEvaluation: {
      decision: 'MANUAL_APPROVAL',
      riskScore: 78,
      reasons: [
        'JIT request — time-bound access (4 hours)',
        'Role is HIGH_PRIVILEGE',
        'Manager pre-approval on file',
        'JIT policy P-JIT-HIGHPRIV-001 applied',
      ],
      appliedPolicy: 'P-JIT-HIGHPRIV-001',
      sodConflicts: [],
      evaluatedAt: '2026-05-05T10:00:05Z',
    },
  },
  {
    id: 'jit-2',
    principalId: eu[5].id,
    principalType: 'enterprise-user',
    enterpriseUser: eu[5], // Frank Mueller
    role: mockAzureAdRoles[1], // AAD_GlobalAdmin
    durationHours: 2,
    justification: 'Urgent Azure subscription configuration change required for production incident response.',
    requester: 'frank.mueller@acme.com',
    submittedAt: '2026-05-05T09:00:00Z',
    status: 'active',
    activatedAt: '2026-05-05T09:10:00Z',
    expiresAt: '2026-05-05T11:10:00Z',
    approvedBy: 'grace.kim@acme.com',
    policyEvaluation: {
      decision: 'MANUAL_APPROVAL',
      riskScore: 85,
      reasons: [
        'JIT request — time-bound access (2 hours)',
        'Role is HIGH_PRIVILEGE (Global Admin)',
        'Production incident — expedited approval',
        'Dual approval satisfied',
      ],
      appliedPolicy: 'P-JIT-INCIDENT-001',
      sodConflicts: [],
      evaluatedAt: '2026-05-05T09:00:05Z',
    },
  },
  {
    id: 'jit-3',
    principalId: eu[3].id,
    principalType: 'enterprise-user',
    enterpriseUser: eu[3], // David Reyes
    role: mockSapBtpRoles[2], // BTP_FinanceAdmin
    durationHours: 8,
    justification: 'Year-end financial close requires temporary admin access to SAP BTP Finance module.',
    requester: 'david.reyes@acme.com',
    submittedAt: '2026-05-05T08:00:00Z',
    status: 'pending',
    policyEvaluation: {
      decision: 'MANUAL_APPROVAL',
      riskScore: 88,
      reasons: [
        'JIT request — time-bound access (8 hours)',
        'Role is HIGH_PRIVILEGE',
        'SoD conflict detected — security officer review required',
      ],
      appliedPolicy: 'P-JIT-SOD-REVIEW-001',
      sodConflicts: [{ id: 'sod-4', roleA: 'role-btp-3', roleB: 'role-btp-5', classification: 'SAP Finance Write + Approve', detectedAt: '2026-05-05T08:00:05Z' }],
      evaluatedAt: '2026-05-05T08:00:05Z',
    },
  },
  {
    id: 'jit-4',
    principalId: c[36].id,
    principalType: 'consumer',
    consumer: c[36], // ado-svc-prod-deploy
    role: mockAzureAdRoles[1], // AAD_GlobalAdmin
    durationHours: 1,
    justification: 'Automated deployment pipeline requires temporary elevated access for infrastructure provisioning.',
    requester: 'frank.mueller@acme.com',
    submittedAt: '2026-05-04T14:00:00Z',
    status: 'expired',
    activatedAt: '2026-05-04T14:05:00Z',
    expiresAt: expiredExpiry,
    approvedBy: 'frank.mueller@acme.com',
    policyEvaluation: {
      decision: 'AUTO_APPROVE',
      riskScore: 35,
      reasons: [
        'JIT request — time-bound access (1 hour)',
        'Manager pre-approved',
        'JIT auto-approval policy P-JIT-SVC-SHORT-001 satisfied',
      ],
      appliedPolicy: 'P-JIT-SVC-SHORT-001',
      sodConflicts: [],
      evaluatedAt: '2026-05-04T14:00:05Z',
    },
  },
  {
    id: 'jit-5',
    principalId: eu[7].id,
    principalType: 'enterprise-user',
    enterpriseUser: eu[7], // Hiro Tanaka (contractor)
    role: mockKongRoles[7], // gateway-config
    durationHours: 4,
    justification: 'Contractor needs temporary gateway config access for integration testing.',
    requester: 'hiro.tanaka@contractor.acme.com',
    submittedAt: '2026-05-05T11:00:00Z',
    status: 'pending',
    policyEvaluation: {
      decision: 'MANUAL_APPROVAL',
      riskScore: 72,
      reasons: [
        'JIT request — time-bound access (4 hours)',
        'Principal is a CONTRACTOR — elevated scrutiny',
        'Role is HIGH_PRIVILEGE',
        'Sponsor approval required',
      ],
      appliedPolicy: 'P-JIT-CONTRACTOR-HIGHPRIV-001',
      sodConflicts: [],
      evaluatedAt: '2026-05-05T11:00:05Z',
    },
  },
  {
    id: 'jit-6',
    principalId: eu[10].id,
    principalType: 'enterprise-user',
    enterpriseUser: eu[10], // Karen Patel (suspended)
    role: mockSapBtpRoles[2], // BTP_FinanceAdmin
    durationHours: 8,
    justification: 'Need temporary finance admin access for year-end close.',
    requester: 'karen.patel@acme.com',
    submittedAt: '2026-05-03T09:00:00Z',
    status: 'rejected',
    policyEvaluation: {
      decision: 'DENY',
      riskScore: 98,
      reasons: [
        'Principal account is SUSPENDED',
        'Role is HIGH_PRIVILEGE',
        'SoD conflict detected',
        'Policy DENY-SUSPENDED-USER-001 triggered — JIT access blocked',
      ],
      appliedPolicy: 'DENY-SUSPENDED-USER-001',
      sodConflicts: [{ id: 'sod-4', roleA: 'role-btp-3', roleB: 'role-btp-5', classification: 'SAP Finance Write + Approve', detectedAt: '2026-05-03T09:00:05Z' }],
      evaluatedAt: '2026-05-03T09:00:05Z',
    },
  },
]
