import { createContext, useContext, useState, type ReactNode } from 'react'

export type PersonaId = 'end-user' | 'manager' | 'security-analyst' | 'platform-admin' | 'auditor'

export interface Persona {
  id: PersonaId
  name: string
  icon: string
  description: string
  color: string
  capabilities: string[]
  restrictions: string[]
  canApprove: boolean
  canViewAllUsers: boolean
  canManageConnectors: boolean
  canViewReports: boolean
  canEmergencyRevoke: boolean
  canManageSodRules: boolean
  canExportAudit: boolean
}

export const PERSONAS: Record<PersonaId, Persona> = {
  'end-user': {
    id: 'end-user',
    name: 'End User',
    icon: '👤',
    description: 'Self-service access requests and tracking',
    color: 'bg-blue-100 text-blue-800',
    capabilities: ['Submit access requests', 'View own access', 'Track request status', 'Respond to access reviews'],
    restrictions: ['Cannot approve own requests', 'Cannot view other users\' access', 'Cannot modify policies'],
    canApprove: false,
    canViewAllUsers: false,
    canManageConnectors: false,
    canViewReports: false,
    canEmergencyRevoke: false,
    canManageSodRules: false,
    canExportAudit: false,
  },
  'manager': {
    id: 'manager',
    name: 'Manager',
    icon: '👔',
    description: 'Approve team access and view team risk',
    color: 'bg-green-100 text-green-800',
    capabilities: ['All End User capabilities', 'Approve/deny direct reports\' requests', 'View team access', 'Delegate approval', 'View team risk scores'],
    restrictions: ['Cannot approve own requests', 'Cannot modify SoD rules', 'Cannot override SOX controls'],
    canApprove: true,
    canViewAllUsers: false,
    canManageConnectors: false,
    canViewReports: false,
    canEmergencyRevoke: false,
    canManageSodRules: false,
    canExportAudit: false,
  },
  'security-analyst': {
    id: 'security-analyst',
    name: 'Security / GRC Analyst',
    icon: '🔒',
    description: 'Full governance, SoD management, compliance',
    color: 'bg-orange-100 text-orange-800',
    capabilities: ['All Manager capabilities', 'View all identities', 'Manage SoD rules', 'Approve high-risk/SOX requests', 'Launch campaigns', 'Generate compliance reports', 'Emergency revocation'],
    restrictions: ['Cannot modify connector configurations', 'Cannot deploy system changes'],
    canApprove: true,
    canViewAllUsers: true,
    canManageConnectors: false,
    canViewReports: true,
    canEmergencyRevoke: true,
    canManageSodRules: true,
    canExportAudit: true,
  },
  'platform-admin': {
    id: 'platform-admin',
    name: 'Platform Admin',
    icon: '⚙️',
    description: 'Full platform administration',
    color: 'bg-purple-100 text-purple-800',
    capabilities: ['All Security/GRC capabilities', 'Configure connectors', 'Manage target system registry', 'Define workflow templates', 'Configure policy engine', 'Monitor connector health'],
    restrictions: ['All admin actions logged', 'Policy changes require 4-eye approval', 'No direct access to connector credentials'],
    canApprove: true,
    canViewAllUsers: true,
    canManageConnectors: true,
    canViewReports: true,
    canEmergencyRevoke: true,
    canManageSodRules: true,
    canExportAudit: true,
  },
  'auditor': {
    id: 'auditor',
    name: 'External Auditor',
    icon: '📋',
    description: 'Read-only compliance and audit evidence',
    color: 'bg-gray-100 text-gray-800',
    capabilities: ['View pre-built compliance reports', 'Export audit evidence', 'View SoD violation history', 'View access certification results', 'View policy configurations (read-only)'],
    restrictions: ['No write operations', 'Cannot view raw PII (masked)', 'Cannot access connector configurations'],
    canApprove: false,
    canViewAllUsers: true,
    canManageConnectors: false,
    canViewReports: true,
    canEmergencyRevoke: false,
    canManageSodRules: false,
    canExportAudit: true,
  },
}

interface PersonaContextValue {
  persona: Persona
  setPersonaId: (id: PersonaId) => void
}

const PersonaContext = createContext<PersonaContextValue>({
  persona: PERSONAS['platform-admin'],
  setPersonaId: () => {},
})

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaId] = useState<PersonaId>('platform-admin')
  return (
    <PersonaContext.Provider value={{ persona: PERSONAS[personaId], setPersonaId }}>
      {children}
    </PersonaContext.Provider>
  )
}

export function usePersona() {
  return useContext(PersonaContext)
}
