import type { ApprovalRequest } from '../types/domain'

/**
 * ACMP Workflow Templates
 * Based on the proposal's 5 named templates.
 */

export type WorkflowTemplate =
  | 'STANDARD_NON_SOX'
  | 'SOX_GOVERNED'
  | 'EMERGENCY_REVOCATION'
  | 'ACCESS_REVIEW_CAMPAIGN'
  | 'JIT_PRIVILEGED_ACCESS'

export interface WorkflowTemplateDefinition {
  id: WorkflowTemplate
  name: string
  description: string
  sla: string
  autoApproveEligible: boolean
  approverChain: string[]
  color: string
  icon: string
  badge: string
}

export const WORKFLOW_TEMPLATES: Record<WorkflowTemplate, WorkflowTemplateDefinition> = {
  STANDARD_NON_SOX: {
    id: 'STANDARD_NON_SOX',
    name: 'Standard (Non-SOX)',
    description: 'Routine, low-risk access requests not subject to SOX compliance.',
    sla: '4 hours',
    autoApproveEligible: true,
    approverChain: ['Direct Manager'],
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: '📋',
    badge: 'Standard',
  },
  SOX_GOVERNED: {
    id: 'SOX_GOVERNED',
    name: 'SOX Governed',
    description: 'Access to financially sensitive systems subject to Sarbanes-Oxley regulation. Never auto-approves.',
    sla: '2 business days',
    autoApproveEligible: false,
    approverChain: ['Direct Manager', 'Security Team', 'IAG Approval Chain'],
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: '⚖️',
    badge: 'SOX',
  },
  EMERGENCY_REVOCATION: {
    id: 'EMERGENCY_REVOCATION',
    name: 'Emergency Revocation',
    description: 'Immediate removal of all access in response to a security incident. Fully automated.',
    sla: '30 minutes',
    autoApproveEligible: true,
    approverChain: ['Security Auto-Execute'],
    color: 'bg-red-200 text-red-900 border-red-300',
    icon: '🚨',
    badge: 'Emergency',
  },
  ACCESS_REVIEW_CAMPAIGN: {
    id: 'ACCESS_REVIEW_CAMPAIGN',
    name: 'Access Review Campaign',
    description: 'Periodic recertification campaign. 14-day window with escalation ladder.',
    sla: '14 days',
    autoApproveEligible: false,
    approverChain: ['Role Owner', 'Manager (Day 7 escalation)', 'VP (Day 12 escalation)'],
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: '🔄',
    badge: 'Review',
  },
  JIT_PRIVILEGED_ACCESS: {
    id: 'JIT_PRIVILEGED_ACCESS',
    name: 'JIT Privileged Access',
    description: 'Just-In-Time elevation for privileged operations. Max 8 hours, auto-deactivates.',
    sla: '1 hour activation',
    autoApproveEligible: false,
    approverChain: ['Security Team'],
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: '⏱',
    badge: 'JIT',
  },
}

// SOX-tagged systems
const SOX_SYSTEMS = ['sap-btp']
const SOX_ROLE_KEYWORDS = ['finance', 'payment', 'billing', 'sox', 'audit']

export function classifyWorkflowTemplate(request: ApprovalRequest): WorkflowTemplate {
  // Emergency revocation
  if (request.requestType === 'revoke' && request.severity === 'critical') {
    return 'EMERGENCY_REVOCATION'
  }

  // JIT
  if (request.requestType === 'jit') {
    return 'JIT_PRIVILEGED_ACCESS'
  }

  // SOX governed — SAP BTP finance roles
  const isSOXSystem = SOX_SYSTEMS.includes(request.role.system)
  const isSOXRole = SOX_ROLE_KEYWORDS.some(kw =>
    request.role.name.toLowerCase().includes(kw) ||
    (request.role.description ?? '').toLowerCase().includes(kw)
  )
  if (isSOXSystem && isSOXRole) {
    return 'SOX_GOVERNED'
  }

  // Standard non-SOX
  return 'STANDARD_NON_SOX'
}

export function getApproverChain(request: ApprovalRequest): string[] {
  const template = classifyWorkflowTemplate(request)
  const def = WORKFLOW_TEMPLATES[template]

  // Augment chain based on risk
  if (template === 'STANDARD_NON_SOX') {
    if (request.role.isHighPrivilege) {
      return ['Direct Manager', 'Resource Owner', 'Security Team']
    }
    if (request.severity === 'high' || request.severity === 'critical') {
      return ['Direct Manager', 'Resource Owner']
    }
  }

  return def.approverChain
}
