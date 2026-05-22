import type { EnterpriseUser, RoleAssignment } from '../types/domain'

/**
 * ACMP Risk Score Formula (0–10 scale)
 * Based on the proposal's 7-factor model.
 *
 * Factor                          Max Points
 * ─────────────────────────────────────────
 * HIGH/CRITICAL entitlements       2.5
 * Active SoD conflicts             2.0
 * Platforms with access            1.0
 * Privileged role active           1.5
 * Days since last access review    1.0
 * Identity type (external = +1)    1.0
 * Anomaly flags (last 30 days)     1.0
 * ─────────────────────────────────────────
 * Total                           10.0
 */

export interface RiskScoreBreakdown {
  total: number
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  factors: {
    label: string
    score: number
    max: number
    detail: string
  }[]
  recommendation: string
}

export function computeRiskScore(
  user: EnterpriseUser,
  assignments: RoleAssignment[]
): RiskScoreBreakdown {
  const active = assignments.filter(a => a.principalId === user.id && a.isActive)

  // Factor 1: HIGH/CRITICAL entitlements (max 2.5)
  const highCritCount = active.filter(a =>
    a.role.isHighPrivilege || a.role.privilegeLevel === 'high-privilege' || a.severity === 'critical'
  ).length
  const f1 = Math.min(2.5, highCritCount * 0.6)

  // Factor 2: Active SoD conflicts (max 2.0)
  const sodCount = active.filter(a => a.role.sodConflicts.length > 0).length
  const f2 = Math.min(2.0, sodCount * 0.8)

  // Factor 3: Platforms with access (max 1.0)
  const platformCount = new Set(active.map(a => a.role.system)).size
  const f3 = Math.min(1.0, platformCount * 0.25)

  // Factor 4: Privileged role active (max 1.5) — binary
  const hasPrivileged = active.some(a => a.role.isHighPrivilege)
  const f4 = hasPrivileged ? 1.5 : 0

  // Factor 5: Days since last access review (max 1.0)
  // Use the oldest active assignment date as proxy for "last reviewed" — longer = staler
  const oldestAssignment = active.reduce((oldest, a) => {
    return !oldest || a.assignedAt < oldest ? a.assignedAt : oldest
  }, '' as string)
  const daysSinceReview = oldestAssignment
    ? Math.floor((Date.now() - new Date(oldestAssignment).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0
  const f5 = Math.min(1.0, daysSinceReview / 3) // 3+ years without review = max score

  // Factor 6: Identity type (max 1.0) — external = +1
  const isExternal = user.userType === 'contractor' || user.userType === 'partner'
  const f6 = isExternal ? 1.0 : 0

  // Factor 7: Anomaly flags (max 1.0) — simulate based on status
  const f7 = user.status === 'suspended' ? 1.0 : user.status === 'inactive' ? 0.5 : 0

  const total = Math.min(10, Math.round((f1 + f2 + f3 + f4 + f5 + f6 + f7) * 10) / 10)

  const level: RiskScoreBreakdown['level'] =
    total <= 2 ? 'LOW' :
    total <= 5 ? 'MEDIUM' :
    total <= 8 ? 'HIGH' : 'CRITICAL'

  const recommendation =
    level === 'LOW'      ? 'Access requests can be auto-approved without human intervention.' :
    level === 'MEDIUM'   ? 'Standard approval workflow required.' :
    level === 'HIGH'     ? 'Enhanced approval (additional approvers) plus ongoing monitoring.' :
                           'New access requests are blocked until a mandatory review reduces the score.'

  return {
    total,
    level,
    recommendation,
    factors: [
      { label: 'High/Critical Entitlements', score: Math.round(f1 * 10) / 10, max: 2.5, detail: `${highCritCount} high/critical role${highCritCount !== 1 ? 's' : ''}` },
      { label: 'Active SoD Conflicts',       score: Math.round(f2 * 10) / 10, max: 2.0, detail: `${sodCount} conflict${sodCount !== 1 ? 's' : ''}` },
      { label: 'Platforms with Access',      score: Math.round(f3 * 10) / 10, max: 1.0, detail: `${platformCount} system${platformCount !== 1 ? 's' : ''}` },
      { label: 'Privileged Role Active',     score: f4,                        max: 1.5, detail: hasPrivileged ? 'Yes — admin/privileged role held' : 'No privileged roles' },
      { label: 'Days Since Last Review',     score: Math.round(f5 * 10) / 10, max: 1.0, detail: `Oldest active assignment: ${oldestAssignment ? Math.floor((Date.now() - new Date(oldestAssignment).getTime()) / 86400000) + ' days ago' : 'N/A'}` },
      { label: 'Identity Type',              score: f6,                        max: 1.0, detail: isExternal ? `External (${user.userType})` : 'Internal employee' },
      { label: 'Anomaly Flags (30d)',        score: f7,                        max: 1.0, detail: user.status === 'suspended' ? 'Account suspended' : user.status === 'inactive' ? 'Account inactive' : 'No anomalies' },
    ],
  }
}

export function getRiskColor(score: number): string {
  if (score <= 2) return 'text-green-600'
  if (score <= 5) return 'text-yellow-600'
  if (score <= 8) return 'text-orange-600'
  return 'text-red-600'
}

export function getRiskBg(score: number): string {
  if (score <= 2) return 'bg-green-100 text-green-800'
  if (score <= 5) return 'bg-yellow-100 text-yellow-800'
  if (score <= 8) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}
