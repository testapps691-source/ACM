import type { Role, SodConflict } from '../types/domain'

// ─── SoD Conflicts ────────────────────────────────────────────────────────────

const sodConflict1: SodConflict = {
  id: 'sod-1', roleA: 'role-3', roleB: 'role-7',
  classification: 'Financial Segregation', detectedAt: '2026-04-10T08:00:00Z',
}
const sodConflict2: SodConflict = {
  id: 'sod-2', roleA: 'role-5', roleB: 'role-12',
  classification: 'Admin + Auditor Conflict', detectedAt: '2026-04-15T10:30:00Z',
}
const sodConflict3: SodConflict = {
  id: 'sod-3', roleA: 'role-9', roleB: 'role-14',
  classification: 'Write + Approve Conflict', detectedAt: '2026-04-20T14:00:00Z',
}
const sodConflict4: SodConflict = {
  id: 'sod-4', roleA: 'role-btp-3', roleB: 'role-btp-5',
  classification: 'SAP Finance Write + Approve', detectedAt: '2026-04-22T09:00:00Z',
}
const sodConflict5: SodConflict = {
  id: 'sod-5', roleA: 'role-aad-2', roleB: 'role-aad-4',
  classification: 'Azure Global Admin + Billing Admin', detectedAt: '2026-04-25T11:00:00Z',
}

// ─── Kong Roles ───────────────────────────────────────────────────────────────

export const mockKongRoles: Role[] = [
  { id: 'role-1',  name: 'payments-read',           aclGroup: 'acl-payments-read',           privilegeLevel: 'standard',       owner: 'alice.hartmann@acme.com', isHighPrivilege: false, assignmentCount: 12, environment: 'production',  sodConflicts: [],           system: 'kong', description: 'Read-only access to payments API' },
  { id: 'role-2',  name: 'payments-write',          aclGroup: 'acl-payments-write',          privilegeLevel: 'elevated',       owner: 'bob.nakamura@acme.com',   isHighPrivilege: false, assignmentCount: 5,  environment: 'production',  sodConflicts: [],           system: 'kong', description: 'Write access to payments API' },
  { id: 'role-3',  name: 'payments-admin',          aclGroup: 'acl-payments-admin',          privilegeLevel: 'high-privilege', owner: 'carol.osei@acme.com',     isHighPrivilege: true,  assignmentCount: 2,  environment: 'production',  sodConflicts: [sodConflict1], system: 'kong', description: 'Full admin access to payments service' },
  { id: 'role-4',  name: 'identity-read',           aclGroup: 'acl-identity-read',           privilegeLevel: 'standard',       owner: 'david.reyes@acme.com',    isHighPrivilege: false, assignmentCount: 20, environment: 'production',  sodConflicts: [],           system: 'kong', description: 'Read access to identity service' },
  { id: 'role-5',  name: 'identity-admin',          aclGroup: 'acl-identity-admin',          privilegeLevel: 'high-privilege', owner: 'eva.lindstrom@acme.com',  isHighPrivilege: true,  assignmentCount: 3,  environment: 'production',  sodConflicts: [sodConflict2], system: 'kong', description: 'Admin access to identity service' },
  { id: 'role-6',  name: 'analytics-read',          aclGroup: 'acl-analytics-read',          privilegeLevel: 'standard',       owner: null,                      isHighPrivilege: false, assignmentCount: 8,  environment: 'staging',     sodConflicts: [],           system: 'kong', description: 'Read access to analytics API' },
  { id: 'role-7',  name: 'analytics-write',         aclGroup: 'acl-analytics-write',         privilegeLevel: 'elevated',       owner: null,                      isHighPrivilege: false, assignmentCount: 4,  environment: 'staging',     sodConflicts: [sodConflict1], system: 'kong', description: 'Write access to analytics API' },
  { id: 'role-8',  name: 'gateway-config',          aclGroup: 'acl-gateway-config',          privilegeLevel: 'high-privilege', owner: 'frank.mueller@acme.com',  isHighPrivilege: true,  assignmentCount: 1,  environment: 'production',  sodConflicts: [],           system: 'kong', description: 'Kong gateway configuration access' },
  { id: 'role-9',  name: 'orders-write',            aclGroup: 'acl-orders-write',            privilegeLevel: 'elevated',       owner: 'grace.kim@acme.com',      isHighPrivilege: false, assignmentCount: 7,  environment: 'production',  sodConflicts: [sodConflict3], system: 'kong', description: 'Write access to orders API' },
  { id: 'role-10', name: 'orders-read',             aclGroup: 'acl-orders-read',             privilegeLevel: 'standard',       owner: 'alice.hartmann@acme.com', isHighPrivilege: false, assignmentCount: 15, environment: 'production',  sodConflicts: [],           system: 'kong', description: 'Read access to orders API' },
  { id: 'role-11', name: 'dev-payments-read',       aclGroup: 'acl-dev-payments-read',       privilegeLevel: 'standard',       owner: 'bob.nakamura@acme.com',   isHighPrivilege: false, assignmentCount: 6,  environment: 'development', sodConflicts: [],           system: 'kong', description: 'Dev read access to payments API' },
  { id: 'role-12', name: 'dev-identity-admin',      aclGroup: 'acl-dev-identity-admin',      privilegeLevel: 'elevated',       owner: null,                      isHighPrivilege: false, assignmentCount: 3,  environment: 'development', sodConflicts: [sodConflict2], system: 'kong', description: 'Dev admin access to identity service' },
  { id: 'role-13', name: 'staging-gateway-config',  aclGroup: 'acl-staging-gateway-config',  privilegeLevel: 'high-privilege', owner: 'carol.osei@acme.com',     isHighPrivilege: true,  assignmentCount: 2,  environment: 'staging',     sodConflicts: [],           system: 'kong', description: 'Staging gateway config access' },
  { id: 'role-14', name: 'orders-approve',          aclGroup: 'acl-orders-approve',          privilegeLevel: 'elevated',       owner: 'frank.mueller@acme.com',  isHighPrivilege: false, assignmentCount: 4,  environment: 'production',  sodConflicts: [sodConflict3], system: 'kong', description: 'Order approval workflow access' },
  { id: 'role-15', name: 'reporting-read',          aclGroup: 'acl-reporting-read',          privilegeLevel: 'standard',       owner: 'grace.kim@acme.com',      isHighPrivilege: false, assignmentCount: 18, environment: 'production',  sodConflicts: [],           system: 'kong', description: 'Read access to reporting API' },
  { id: 'role-16', name: 'reporting-admin',         aclGroup: 'acl-reporting-admin',         privilegeLevel: 'high-privilege', owner: null,                      isHighPrivilege: true,  assignmentCount: 1,  environment: 'production',  sodConflicts: [],           system: 'kong', description: 'Admin access to reporting service' },
  { id: 'role-17', name: 'dev-orders-write',        aclGroup: 'acl-dev-orders-write',        privilegeLevel: 'standard',       owner: 'alice.hartmann@acme.com', isHighPrivilege: false, assignmentCount: 9,  environment: 'development', sodConflicts: [],           system: 'kong', description: 'Dev write access to orders API' },
  { id: 'role-18', name: 'staging-payments-admin',  aclGroup: 'acl-staging-payments-admin',  privilegeLevel: 'elevated',       owner: 'bob.nakamura@acme.com',   isHighPrivilege: false, assignmentCount: 2,  environment: 'staging',     sodConflicts: [],           system: 'kong', description: 'Staging payments admin access' },
  { id: 'role-19', name: 'super-admin',             aclGroup: 'acl-super-admin',             privilegeLevel: 'high-privilege', owner: 'grace.kim@acme.com',      isHighPrivilege: true,  assignmentCount: 1,  environment: 'production',  sodConflicts: [],           system: 'kong', description: 'Full super-admin access across all Kong services' },
  { id: 'role-20', name: 'dev-analytics-read',      aclGroup: 'acl-dev-analytics-read',      privilegeLevel: 'standard',       owner: 'carol.osei@acme.com',     isHighPrivilege: false, assignmentCount: 5,  environment: 'development', sodConflicts: [],           system: 'kong', description: 'Dev read access to analytics API' },
]

// ─── SAP BTP Roles ────────────────────────────────────────────────────────────

export const mockSapBtpRoles: Role[] = [
  { id: 'role-btp-1', name: 'BTP_FinanceViewer',       aclGroup: 'btp-finance-viewer',       privilegeLevel: 'standard',       owner: 'eva.lindstrom@acme.com',  isHighPrivilege: false, assignmentCount: 8,  environment: 'production',  sodConflicts: [],           system: 'sap-btp', description: 'View-only access to SAP BTP Finance module' },
  { id: 'role-btp-2', name: 'BTP_FinanceProcessor',    aclGroup: 'btp-finance-processor',    privilegeLevel: 'elevated',       owner: 'david.reyes@acme.com',    isHighPrivilege: false, assignmentCount: 5,  environment: 'production',  sodConflicts: [],           system: 'sap-btp', description: 'Process financial transactions in SAP BTP' },
  { id: 'role-btp-3', name: 'BTP_FinanceAdmin',        aclGroup: 'btp-finance-admin',        privilegeLevel: 'high-privilege', owner: 'eva.lindstrom@acme.com',  isHighPrivilege: true,  assignmentCount: 2,  environment: 'production',  sodConflicts: [sodConflict4], system: 'sap-btp', description: 'Full admin access to SAP BTP Finance' },
  { id: 'role-btp-4', name: 'BTP_IntegrationDev',      aclGroup: 'btp-integration-dev',      privilegeLevel: 'elevated',       owner: 'alice.hartmann@acme.com', isHighPrivilege: false, assignmentCount: 4,  environment: 'production',  sodConflicts: [],           system: 'sap-btp', description: 'Develop integrations in SAP BTP Integration Suite' },
  { id: 'role-btp-5', name: 'BTP_FinanceApprover',     aclGroup: 'btp-finance-approver',     privilegeLevel: 'elevated',       owner: 'eva.lindstrom@acme.com',  isHighPrivilege: false, assignmentCount: 3,  environment: 'production',  sodConflicts: [sodConflict4], system: 'sap-btp', description: 'Approve financial workflows in SAP BTP' },
  { id: 'role-btp-6', name: 'BTP_SubaccountAdmin',     aclGroup: 'btp-subaccount-admin',     privilegeLevel: 'high-privilege', owner: 'frank.mueller@acme.com',  isHighPrivilege: true,  assignmentCount: 1,  environment: 'production',  sodConflicts: [],           system: 'sap-btp', description: 'Administer SAP BTP subaccounts' },
  { id: 'role-btp-7', name: 'BTP_FinanceViewer_STG',   aclGroup: 'btp-finance-viewer-stg',   privilegeLevel: 'standard',       owner: null,                      isHighPrivilege: false, assignmentCount: 3,  environment: 'staging',     sodConflicts: [],           system: 'sap-btp', description: 'Staging view access to SAP BTP Finance' },
  { id: 'role-btp-8', name: 'BTP_IntegrationAdmin',    aclGroup: 'btp-integration-admin',    privilegeLevel: 'high-privilege', owner: 'carol.osei@acme.com',     isHighPrivilege: true,  assignmentCount: 1,  environment: 'production',  sodConflicts: [],           system: 'sap-btp', description: 'Admin access to SAP BTP Integration Suite' },
]

// ─── Azure AD Roles ───────────────────────────────────────────────────────────

export const mockAzureAdRoles: Role[] = [
  { id: 'role-aad-1', name: 'AAD_Reader',             aclGroup: 'aad-directory-readers',     privilegeLevel: 'standard',       owner: 'carol.osei@acme.com',     isHighPrivilege: false, assignmentCount: 15, environment: 'production',  sodConflicts: [],           system: 'azure-ad', description: 'Read Azure AD directory objects' },
  { id: 'role-aad-2', name: 'AAD_GlobalAdmin',        aclGroup: 'aad-global-admins',         privilegeLevel: 'high-privilege', owner: 'grace.kim@acme.com',      isHighPrivilege: true,  assignmentCount: 2,  environment: 'production',  sodConflicts: [sodConflict5], system: 'azure-ad', description: 'Full Azure AD global administrator' },
  { id: 'role-aad-3', name: 'AAD_UserAdmin',          aclGroup: 'aad-user-admins',           privilegeLevel: 'elevated',       owner: 'carol.osei@acme.com',     isHighPrivilege: false, assignmentCount: 4,  environment: 'production',  sodConflicts: [],           system: 'azure-ad', description: 'Manage Azure AD users and groups' },
  { id: 'role-aad-4', name: 'AAD_BillingAdmin',       aclGroup: 'aad-billing-admins',        privilegeLevel: 'high-privilege', owner: 'eva.lindstrom@acme.com',  isHighPrivilege: true,  assignmentCount: 2,  environment: 'production',  sodConflicts: [sodConflict5], system: 'azure-ad', description: 'Manage Azure billing and subscriptions' },
  { id: 'role-aad-5', name: 'AAD_SecurityReader',     aclGroup: 'aad-security-readers',      privilegeLevel: 'standard',       owner: 'grace.kim@acme.com',      isHighPrivilege: false, assignmentCount: 6,  environment: 'production',  sodConflicts: [],           system: 'azure-ad', description: 'Read Azure security information' },
  { id: 'role-aad-6', name: 'AAD_ConditionalAccess',  aclGroup: 'aad-ca-admins',             privilegeLevel: 'elevated',       owner: 'carol.osei@acme.com',     isHighPrivilege: false, assignmentCount: 3,  environment: 'production',  sodConflicts: [],           system: 'azure-ad', description: 'Manage Azure AD Conditional Access policies' },
  { id: 'role-aad-7', name: 'AAD_AppRegistration',    aclGroup: 'aad-app-devs',              privilegeLevel: 'elevated',       owner: 'alice.hartmann@acme.com', isHighPrivilege: false, assignmentCount: 7,  environment: 'production',  sodConflicts: [],           system: 'azure-ad', description: 'Register and manage Azure AD applications' },
  { id: 'role-aad-8', name: 'AAD_Reader_STG',         aclGroup: 'aad-directory-readers-stg', privilegeLevel: 'standard',       owner: null,                      isHighPrivilege: false, assignmentCount: 5,  environment: 'staging',     sodConflicts: [],           system: 'azure-ad', description: 'Staging read access to Azure AD' },
]

// ─── ADO Pipeline Roles ───────────────────────────────────────────────────────

export const mockAdoRoles: Role[] = [
  { id: 'role-ado-1', name: 'ADO_Reader',             aclGroup: 'ado-project-readers',       privilegeLevel: 'standard',       owner: 'bob.nakamura@acme.com',   isHighPrivilege: false, assignmentCount: 10, environment: 'production',  sodConflicts: [],           system: 'ado-pipelines', description: 'Read access to ADO projects and pipelines' },
  { id: 'role-ado-2', name: 'ADO_Contributor',        aclGroup: 'ado-contributors',          privilegeLevel: 'elevated',       owner: 'alice.hartmann@acme.com', isHighPrivilege: false, assignmentCount: 8,  environment: 'production',  sodConflicts: [],           system: 'ado-pipelines', description: 'Contribute to ADO repos and trigger pipelines' },
  { id: 'role-ado-3', name: 'ADO_PipelineAdmin',      aclGroup: 'ado-pipeline-admins',       privilegeLevel: 'high-privilege', owner: 'frank.mueller@acme.com',  isHighPrivilege: true,  assignmentCount: 3,  environment: 'production',  sodConflicts: [],           system: 'ado-pipelines', description: 'Administer ADO pipelines and release gates' },
  { id: 'role-ado-4', name: 'ADO_ProjectAdmin',       aclGroup: 'ado-project-admins',        privilegeLevel: 'high-privilege', owner: 'frank.mueller@acme.com',  isHighPrivilege: true,  assignmentCount: 2,  environment: 'production',  sodConflicts: [],           system: 'ado-pipelines', description: 'Full admin access to ADO projects' },
  { id: 'role-ado-5', name: 'ADO_ReleaseManager',     aclGroup: 'ado-release-managers',      privilegeLevel: 'elevated',       owner: 'alice.hartmann@acme.com', isHighPrivilege: false, assignmentCount: 4,  environment: 'production',  sodConflicts: [],           system: 'ado-pipelines', description: 'Manage ADO release pipelines and approvals' },
  { id: 'role-ado-6', name: 'ADO_ServiceConnection',  aclGroup: 'ado-service-connections',   privilegeLevel: 'elevated',       owner: 'bob.nakamura@acme.com',   isHighPrivilege: false, assignmentCount: 5,  environment: 'production',  sodConflicts: [],           system: 'ado-pipelines', description: 'Manage ADO service connections to external systems' },
  { id: 'role-ado-7', name: 'ADO_Contributor_STG',    aclGroup: 'ado-contributors-stg',      privilegeLevel: 'standard',       owner: null,                      isHighPrivilege: false, assignmentCount: 6,  environment: 'staging',     sodConflicts: [],           system: 'ado-pipelines', description: 'Staging contributor access to ADO' },
]

// ─── Combined export ──────────────────────────────────────────────────────────

export const mockRoles: Role[] = [
  ...mockKongRoles,
  ...mockSapBtpRoles,
  ...mockAzureAdRoles,
  ...mockAdoRoles,
]
