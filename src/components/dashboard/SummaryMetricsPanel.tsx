import type { SummaryMetrics } from '../../types/domain'
import { useNavigate } from 'react-router-dom'

interface MetricCardProps {
  label: string
  value: number
  icon: string
  color: string
  alert?: boolean
  linkTo?: string
}

function MetricCard({ label, value, icon, color, alert, linkTo }: MetricCardProps) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => linkTo && navigate(linkTo)}
      className={`bg-white rounded-xl border ${alert && value > 0 ? 'border-red-200' : 'border-gray-200'} p-4 flex items-center gap-3 shadow-sm ${linkTo ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center text-xl flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <div className={`text-2xl font-bold ${alert && value > 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {value}
        </div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
    </div>
  )
}

interface SummaryMetricsPanelProps {
  metrics: SummaryMetrics
}

export function SummaryMetricsPanel({ metrics }: SummaryMetricsPanelProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      <MetricCard label="High-Privilege" value={metrics.highPrivilegeCount} icon="🔐" color="bg-purple-50" alert linkTo="/roles" />
      <MetricCard label="Unowned Roles"  value={metrics.unownedRoleCount}   icon="👤" color="bg-orange-50" alert linkTo="/roles" />
      <MetricCard label="SoD Conflicts"  value={metrics.openSodConflictCount} icon="⚠️" color="bg-red-50" alert linkTo="/graph" />
      <MetricCard label="Pending Approvals" value={metrics.pendingApprovalCount} icon="⏳" color="bg-yellow-50" linkTo="/approvals" />
      <MetricCard label="Orphaned Accounts" value={metrics.orphanedAccountCount} icon="🚨" color="bg-red-50" alert linkTo="/heatmap" />
      <MetricCard label="Active JIT Sessions" value={metrics.jitActiveCount} icon="⏱" color="bg-green-50" linkTo="/jit" />
    </div>
  )
}
