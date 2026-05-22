import type { RoleAssignment } from '../../types/domain'
import { DataTable, type ColumnDef } from '../ui/DataTable'
import { Badge } from '../ui/Badge'
import { SYSTEM_COLORS, SYSTEM_LABELS } from '../../utils/buildGraphData'

interface RoleAssignmentTableProps {
  assignments: RoleAssignment[]
  onSelect?: (a: RoleAssignment) => void
}

function principalName(row: RoleAssignment): string {
  return row.enterpriseUser?.displayName ?? row.consumer?.username ?? row.principalId
}

function principalEnv(row: RoleAssignment): string {
  return row.consumer?.environment ?? row.enterpriseUser?.environment ?? '—'
}

export function RoleAssignmentTable({ assignments, onSelect }: RoleAssignmentTableProps) {
  const columns: ColumnDef<RoleAssignment>[] = [
    {
      key: 'principal',
      header: 'Principal',
      render: row => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{row.principalType === 'enterprise-user' ? '👤' : '🤖'}</span>
          <span className="font-medium text-gray-900">{principalName(row)}</span>
        </div>
      ),
      sortable: true,
      getValue: row => principalName(row),
    },
    {
      key: 'role',
      header: 'Role',
      render: row => (
        <div className="flex items-center gap-1.5">
          {row.role.isHighPrivilege && (
            <span title="High-privilege role" className="text-purple-600" data-testid="high-privilege-indicator">🔐</span>
          )}
          {row.role.sodConflicts.length > 0 && (
            <span title="SoD conflict detected" className="text-red-500" data-testid="sod-conflict-indicator">⚠️</span>
          )}
          <span>{row.role.name}</span>
        </div>
      ),
      sortable: true,
      getValue: row => row.role.name,
    },
    {
      key: 'system',
      header: 'System',
      render: row => (
        <span
          className="text-xs font-medium text-white px-2 py-0.5 rounded-full"
          style={{ background: SYSTEM_COLORS[row.role.system] }}
        >
          {SYSTEM_LABELS[row.role.system]}
        </span>
      ),
      sortable: true,
      getValue: row => row.role.system,
    },
    {
      key: 'privilegeLevel',
      header: 'Privilege',
      render: row => <Badge value={row.role.privilegeLevel} variant="privilege" />,
      sortable: true,
      getValue: row => row.role.privilegeLevel,
    },
    {
      key: 'severity',
      header: 'Severity',
      render: row => <Badge value={row.severity} variant="severity" />,
      sortable: true,
      getValue: row => row.severity,
    },
    {
      key: 'environment',
      header: 'Environment',
      render: row => (
        <span className="text-xs text-gray-500 capitalize">{principalEnv(row)}</span>
      ),
      sortable: true,
      getValue: row => principalEnv(row),
    },
    {
      key: 'lifecycleStage',
      header: 'Stage',
      render: row => (
        <span className="text-xs text-gray-500 capitalize">{row.lifecycleStage.replace(/-/g, ' ')}</span>
      ),
    },
    {
      key: 'assignedAt',
      header: 'Assigned',
      render: row => (
        <span className="text-xs text-gray-500">{row.assignedAt.split('T')[0]}</span>
      ),
      sortable: true,
      getValue: row => row.assignedAt,
    },
    {
      key: 'approvedBy',
      header: 'Approved By',
      render: row => <span className="text-xs text-gray-500">{row.approvedBy}</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={assignments}
      rowKey={row => row.id}
      onRowClick={onSelect}
      emptyMessage="No role assignments match the selected filters."
    />
  )
}
