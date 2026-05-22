import type { AuditLogEntry, AuditLogFilters } from '../types/domain'

export function filterAuditLog(
  entries: AuditLogEntry[],
  filters: AuditLogFilters
): AuditLogEntry[] {
  return entries.filter(e => {
    if (filters.startDate && e.timestamp < filters.startDate) return false
    if (filters.endDate && e.timestamp > filters.endDate + 'T23:59:59Z') return false
    if (filters.actor && !e.actor.toLowerCase().includes(filters.actor.toLowerCase())) return false
    if (filters.operationTypes && filters.operationTypes.length > 0) {
      if (!filters.operationTypes.includes(e.operationType)) return false
    }
    return true
  })
}
