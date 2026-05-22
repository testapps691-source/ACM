import type { RoleAssignment, DashboardFilters } from '../types/domain'

export function filterRoleAssignments(
  assignments: RoleAssignment[],
  filters: DashboardFilters
): RoleAssignment[] {
  return assignments.filter(a => {
    // System filter — scope to selected connected system
    if (filters.system !== 'all' && a.role.system !== filters.system) return false
    // Environment — resolve from whichever principal type is present
    const env = a.consumer?.environment ?? a.enterpriseUser?.environment
    if (filters.environment !== 'all' && env !== filters.environment) return false
    if (filters.privilegeLevel !== 'all' && a.role.privilegeLevel !== filters.privilegeLevel) return false
    if (filters.severity !== 'all' && a.severity !== filters.severity) return false
    return true
  })
}
