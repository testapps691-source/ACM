import type { RoleAssignment, Role, ApprovalRequest, SummaryMetrics, SystemType } from '../types/domain'
import { mockEnterpriseUsers } from '../mock/mockEnterpriseUsers'
import { mockJitRequests } from '../mock/mockJitRequests'

export function computeSummaryMetrics(
  assignments: RoleAssignment[],
  roles: Role[],
  requests: ApprovalRequest[],
  system: SystemType | 'all' = 'all'
): SummaryMetrics {
  // Scope assignments and roles to selected system
  const scopedAssignments = system === 'all'
    ? assignments
    : assignments.filter(a => a.role.system === system)

  const scopedRoles = system === 'all'
    ? roles
    : roles.filter(r => r.system === system)

  const scopedRequests = system === 'all'
    ? requests
    : requests.filter(r => r.role.system === system)

  const highPrivilegeCount = scopedAssignments.filter(a => a.role.isHighPrivilege && a.isActive).length
  const unownedRoleCount = scopedRoles.filter(r => r.owner === null).length
  const openSodConflictCount = scopedAssignments.filter(
    a => a.isActive && a.role.sodConflicts.length > 0
  ).length
  const pendingApprovalCount = scopedRequests.filter(r => r.status === 'pending').length

  // Orphaned: inactive/suspended users with active assignments in this system
  const orphanedAccountCount = mockEnterpriseUsers.filter(u =>
    (u.status === 'inactive' || u.status === 'suspended') &&
    scopedAssignments.some(a => a.principalId === u.id && a.isActive)
  ).length

  const jitActiveCount = system === 'all'
    ? mockJitRequests.filter(r => r.status === 'active').length
    : mockJitRequests.filter(r => r.status === 'active' && r.role.system === system).length

  return { highPrivilegeCount, unownedRoleCount, openSodConflictCount, pendingApprovalCount, orphanedAccountCount, jitActiveCount }
}
