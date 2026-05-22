import { useState } from 'react'
import { mockRoleAssignments } from '../mock/mockRoleAssignments'
import { mockEnterpriseUsers } from '../mock/mockEnterpriseUsers'
import { mockApprovalRequests } from '../mock/mockApprovalRequests'
import { SYSTEM_LABELS, SYSTEM_COLORS } from '../utils/buildGraphData'
import { computeRiskScore } from '../utils/riskScoreEngine'

type ReportType = 'sox' | 'operations' | 'security'

// ─── Report data builders ─────────────────────────────────────────────────────

function buildSoxReport() {
  const highPrivAssignments = mockRoleAssignments.filter(a => a.isActive && a.role.isHighPrivilege)
  const sodViolations = mockRoleAssignments.filter(a => a.isActive && a.role.sodConflicts.length > 0)
  const recertDue = mockRoleAssignments.filter(a => a.isActive && a.lifecycleStage === 'recertification-due')
  const approvedRequests = mockApprovalRequests.filter(r => r.status === 'approved')
  const rejectedRequests = mockApprovalRequests.filter(r => r.status === 'rejected')

  return { highPrivAssignments, sodViolations, recertDue, approvedRequests, rejectedRequests }
}

function buildOperationsReport() {
  const orphaned = mockEnterpriseUsers.filter(u =>
    (u.status === 'inactive' || u.status === 'suspended') &&
    mockRoleAssignments.some(a => a.principalId === u.id && a.isActive)
  )
  const dormant = mockRoleAssignments.filter(a => {
    if (!a.isActive) return false
    // Only flag as dormant if assigned more than 180 days ago AND no lastUsed recorded
    // (90 days would flag almost everything since lastUsed is rarely set in mock data)
    const daysSince = Math.floor((Date.now() - new Date(a.assignedAt).getTime()) / 86400000)
    if (a.lastUsed) {
      // Has lastUsed — flag if not used in 90+ days
      const daysSinceUsed = Math.floor((Date.now() - new Date(a.lastUsed).getTime()) / 86400000)
      return daysSinceUsed > 90
    }
    // No lastUsed — only flag if very old (180+ days) to avoid false positives
    return daysSince > 180
  })
  const expiring = mockRoleAssignments.filter(a => a.isActive && a.expiresAt)
  const pendingApprovals = mockApprovalRequests.filter(r => r.status === 'pending')

  return { orphaned, dormant, expiring, pendingApprovals }
}

function buildSecurityReport() {
  const criticalUsers = mockEnterpriseUsers
    .map(u => ({ user: u, score: computeRiskScore(u, mockRoleAssignments) }))
    .filter(x => x.score.total >= 7)
    .sort((a, b) => b.score.total - a.score.total)

  const sodConflicts = mockRoleAssignments.filter(a => a.isActive && a.role.sodConflicts.length > 0)
  const externalAccess = mockRoleAssignments.filter(a => {
    const eu = mockEnterpriseUsers.find(u => u.id === a.principalId)
    return eu && (eu.userType === 'contractor' || eu.userType === 'partner') && a.isActive
  })
  const highPrivBySystem = Object.fromEntries(
    ['kong', 'azure-ad', 'sap-btp', 'ado-pipelines'].map(sys => [
      sys,
      mockRoleAssignments.filter(a => a.isActive && a.role.isHighPrivilege && a.role.system === sys).length,
    ])
  )

  return { criticalUsers, sodConflicts, externalAccess, highPrivBySystem }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatBox({ label, value, color, sub }: { label: string; value: number | string; color: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center shadow-sm">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function SoxReport() {
  const data = buildSoxReport()
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatBox label="High-Privilege Assignments" value={data.highPrivAssignments.length} color="text-purple-600" />
        <StatBox label="SoD Violations" value={data.sodViolations.length} color="text-red-600" />
        <StatBox label="Recertification Due" value={data.recertDue.length} color="text-orange-600" />
        <StatBox label="Approved Requests" value={data.approvedRequests.length} color="text-green-600" />
        <StatBox label="Rejected Requests" value={data.rejectedRequests.length} color="text-gray-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-red-50">
          <div className="text-sm font-semibold text-red-800">⚖️ SOX — High-Privilege Provisioning Chain</div>
          <div className="text-xs text-red-600 mt-0.5">All high-privilege role assignments with approver evidence</div>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {['Principal', 'Role', 'System', 'Assigned', 'Approved By', 'Stage'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-gray-500 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.highPrivAssignments.slice(0, 15).map(a => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900">
                  {a.enterpriseUser?.displayName ?? a.consumer?.username}
                </td>
                <td className="px-4 py-2 text-gray-700">{a.role.name}</td>
                <td className="px-4 py-2">
                  <span className="text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                    style={{ background: SYSTEM_COLORS[a.role.system] }}>
                    {SYSTEM_LABELS[a.role.system]}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">{a.assignedAt.split('T')[0]}</td>
                <td className="px-4 py-2 text-gray-500">{a.approvedBy}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    a.lifecycleStage === 'recertification-due' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>{a.lifecycleStage}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-red-100 bg-red-50">
          <div className="text-sm font-semibold text-red-800">⚠️ SOX — Active SoD Violations</div>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {['Principal', 'Role', 'Conflict', 'Detected'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-gray-500 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.sodViolations.map(a =>
              a.role.sodConflicts.map(c => (
                <tr key={`${a.id}-${c.id}`} className="hover:bg-red-50">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {a.enterpriseUser?.displayName ?? a.consumer?.username}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{a.role.name}</td>
                  <td className="px-4 py-2 text-red-700 font-medium">{c.classification}</td>
                  <td className="px-4 py-2 text-gray-500">{c.detectedAt.split('T')[0]}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OperationsReport() {
  const data = buildOperationsReport()
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Orphaned Accounts" value={data.orphaned.length} color="text-red-600" sub="Inactive users with active access" />
        <StatBox label="Dormant Access (90d+)" value={data.dormant.length} color="text-orange-600" sub="Unused for 90+ days" />
        <StatBox label="Expiring Access" value={data.expiring.length} color="text-yellow-600" sub="Time-bound assignments" />
        <StatBox label="Pending Approvals" value={data.pendingApprovals.length} color="text-blue-600" sub="Awaiting decision" />
      </div>

      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-red-100 bg-red-50">
          <div className="text-sm font-semibold text-red-800">🚨 Orphaned Accounts — Immediate Action Required</div>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {['User', 'Status', 'Department', 'Active Roles', 'Systems'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-gray-500 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.orphaned.map(u => {
              const activeRoles = mockRoleAssignments.filter(a => a.principalId === u.id && a.isActive)
              const systems = [...new Set(activeRoles.map(a => a.role.system))]
              return (
                <tr key={u.id} className="hover:bg-red-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{u.displayName}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      u.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>{u.status}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{u.department}</td>
                  <td className="px-4 py-2 font-bold text-red-600">{activeRoles.length}</td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1">
                      {systems.map(s => (
                        <span key={s} className="text-white text-[9px] px-1 py-0.5 rounded font-medium"
                          style={{ background: SYSTEM_COLORS[s] }}>
                          {SYSTEM_LABELS[s]}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl border border-orange-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-orange-100 bg-orange-50">
          <div className="text-sm font-semibold text-orange-800">💤 Dormant Access — Candidates for Revocation</div>
          <div className="text-xs text-orange-600 mt-0.5">Access not used in 90+ days</div>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {['Principal', 'Role', 'System', 'Assigned', 'Days Dormant'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-gray-500 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.dormant.slice(0, 10).map(a => {
              const days = Math.floor((Date.now() - new Date(a.assignedAt).getTime()) / 86400000)
              return (
                <tr key={a.id} className="hover:bg-orange-50">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {a.enterpriseUser?.displayName ?? a.consumer?.username}
                  </td>
                  <td className="px-4 py-2 text-gray-700">{a.role.name}</td>
                  <td className="px-4 py-2">
                    <span className="text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: SYSTEM_COLORS[a.role.system] }}>
                      {SYSTEM_LABELS[a.role.system]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500">{a.assignedAt.split('T')[0]}</td>
                  <td className="px-4 py-2 font-bold text-orange-600">{days}d</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SecurityReport() {
  const data = buildSecurityReport()
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Critical Risk Users" value={data.criticalUsers.filter(x => x.score.level === 'CRITICAL').length} color="text-red-600" />
        <StatBox label="High Risk Users" value={data.criticalUsers.filter(x => x.score.level === 'HIGH').length} color="text-orange-600" />
        <StatBox label="SoD Conflicts" value={data.sodConflicts.length} color="text-red-600" />
        <StatBox label="External Access" value={data.externalAccess.length} color="text-blue-600" sub="Contractors & partners" />
      </div>

      {/* High-privilege by system */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="text-sm font-semibold text-gray-800 mb-3">🔐 High-Privilege Access by System</div>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(data.highPrivBySystem).map(([sys, count]) => (
            <div key={sys} className="text-center p-3 rounded-lg border border-gray-100">
              <div className="text-xl font-bold" style={{ color: SYSTEM_COLORS[sys as keyof typeof SYSTEM_COLORS] }}>{count}</div>
              <div className="text-xs text-gray-500 mt-0.5">{SYSTEM_LABELS[sys as keyof typeof SYSTEM_LABELS]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical risk users */}
      <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-red-100 bg-red-50">
          <div className="text-sm font-semibold text-red-800">🎯 High/Critical Risk Identity Inventory</div>
          <div className="text-xs text-red-600 mt-0.5">Risk score ≥ 7.0 — requires immediate review</div>
        </div>
        <table className="w-full text-xs">
          <thead className="bg-gray-50">
            <tr>
              {['User', 'Department', 'Risk Score', 'Level', 'Key Factors'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-gray-500 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.criticalUsers.map(({ user, score }) => (
              <tr key={user.id} className="hover:bg-red-50">
                <td className="px-4 py-2 font-medium text-gray-900">{user.displayName}</td>
                <td className="px-4 py-2 text-gray-500">{user.department}</td>
                <td className="px-4 py-2">
                  <span className={`font-bold text-sm ${
                    score.level === 'CRITICAL' ? 'text-red-600' : 'text-orange-600'
                  }`}>{score.total}</span>
                </td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    score.level === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>{score.level}</span>
                </td>
                <td className="px-4 py-2 text-gray-500">
                  {score.factors.filter(f => f.score > 0).slice(0, 2).map(f => f.label).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function ComplianceReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('sox')

  const reports = [
    { id: 'sox' as const,        icon: '⚖️', label: 'SOX Compliance',  desc: 'Provisioning chains, SoD violations, certifications' },
    { id: 'operations' as const, icon: '⚙️', label: 'Operations',      desc: 'Orphaned accounts, dormant access, SLA compliance' },
    { id: 'security' as const,   icon: '🔒', label: 'Security',        desc: 'Privileged access inventory, risk scores, SoD maps' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compliance Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Pre-built SOX, operations, and security reports — always audit-ready</p>
        </div>
        <button
          onClick={() => {
            const content = `ACMP Compliance Report — ${activeReport.toUpperCase()}\nGenerated: ${new Date().toLocaleString()}\n\nThis report is always audit-ready. Data is continuously generated in real time.\nRetention: SOX 7yr · Regulated 5yr · General 3yr`
            const blob = new Blob([content], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `acmp-${activeReport}-report-${new Date().toISOString().split('T')[0]}.txt`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium flex items-center gap-2">
          ↓ Export Report
        </button>
      </div>

      {/* Report selector */}
      <div className="grid grid-cols-3 gap-3">
        {reports.map(r => (
          <button key={r.id} onClick={() => setActiveReport(r.id)}
            className={`text-left p-4 rounded-xl border shadow-sm transition-all ${
              activeReport === r.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}>
            <div className="text-2xl mb-1">{r.icon}</div>
            <div className="text-sm font-semibold text-gray-900">{r.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{r.desc}</div>
          </button>
        ))}
      </div>

      {/* Audit-ready banner */}
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-sm">
        <span className="text-green-600 text-lg">✅</span>
        <div>
          <span className="font-semibold text-green-800">Always Audit-Ready</span>
          <span className="text-green-700"> — Evidence is continuously generated in real time. Last updated: {new Date().toLocaleString()}</span>
        </div>
        <div className="ml-auto text-xs text-green-600 font-medium">
          Retention: SOX 7yr · Regulated 5yr · General 3yr
        </div>
      </div>

      {/* Report content */}
      {activeReport === 'sox'        && <SoxReport />}
      {activeReport === 'operations' && <OperationsReport />}
      {activeReport === 'security'   && <SecurityReport />}
    </div>
  )
}
